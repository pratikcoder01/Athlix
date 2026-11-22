import os
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import patch
import uuid

import httpx
import main
from task_store import TaskStore

OWNER = "507f1f77bcf86cd799439011"
OTHER = "507f1f77bcf86cd799439012"
KEY = "cv-test-key-for-internal-service-only-12345"
HEADERS = {"X-Athlix-Service-Key": KEY, "X-Athlix-User": OWNER}


class ServiceTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.model = Path(self.directory.name) / "test.task"
        self.model.touch()
        self.environment = patch.dict(os.environ, {"CV_SERVICE_API_KEY": KEY, "CV_MODEL_PATH": str(self.model)})
        self.environment.start()
        self.temp_patch = patch.object(main, "TEMP_DIR", Path(self.directory.name))
        self.temp_patch.start()
        self.store = TaskStore(Path(self.directory.name) / "state" / "tasks.sqlite3")
        self.store_patch = patch.object(main, "STORE", self.store)
        self.store_patch.start()
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=main.app), base_url="http://cv.test")

    async def asyncTearDown(self):
        await self.client.aclose()
        self.store_patch.stop()
        self.temp_patch.stop()
        self.environment.stop()
        self.directory.cleanup()

    def count(self):
        with self.store.connection() as db:
            return db.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]

    async def upload(self, data=b"not-real-video", filename="clip.mp4", media="video/mp4", headers=None):
        return await self.client.post("/analyze", headers=headers or HEADERS, files={"file": (filename, data, media)})

    async def test_authentication_fails_before_upload_parsing(self):
        response = await self.client.post("/analyze", content=b"broken multipart", headers={"Content-Type": "multipart/form-data"})
        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.count(), 0)
        self.assertEqual(list(Path(self.directory.name).glob("*.mp4")), [])
        for headers in ({**HEADERS, "X-Athlix-Service-Key": "wrong"}, {**HEADERS, "X-Athlix-User": "../../user"}):
            self.assertEqual((await self.upload(headers=headers)).status_code, 401)

    async def test_missing_configuration_fails_closed(self):
        with patch.dict(os.environ, {"CV_SERVICE_API_KEY": ""}):
            self.assertEqual((await self.upload()).status_code, 503)
        self.model.unlink()
        self.assertEqual((await self.upload()).status_code, 503)

    async def test_public_readiness_fails_closed_without_leaking_configuration(self):
        response = await self.client.get("/ready")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"detail": "Video service is not ready."})
        async with main.lifespan(main.app):
            self.assertEqual((await self.client.get("/ready")).status_code, 200)
            with patch.dict(os.environ, {"CV_SERVICE_API_KEY": ""}):
                response = await self.client.get("/ready")
                self.assertEqual(response.status_code, 503)
                self.assertEqual(response.json(), {"detail": "Video service is not ready."})

    async def test_mime_and_extension_must_match(self):
        self.assertEqual((await self.upload(filename="clip.exe")).status_code, 415)
        self.assertEqual((await self.upload(media="image/png")).status_code, 415)

    async def test_empty_and_oversize_upload_clean_files_and_release_capacity(self):
        self.assertEqual((await self.upload(data=b"")).status_code, 400)
        with patch.object(main, "MAX_UPLOAD_BYTES", 16):
            self.assertEqual((await self.upload(data=b"x" * 17)).status_code, 413)
        self.assertEqual(list(Path(self.directory.name).glob("*.mp4")), [])
        self.assertEqual(self.count(), 0)
        self.assertTrue(self.store.reserve(OWNER, str(uuid.uuid4()), "digest", ".mp4")[1])

    async def test_body_limit_rejects_declared_and_chunked_bodies(self):
        response = await self.client.post("/analyze", headers={**HEADERS, "Content-Length": str(main.MAX_UPLOAD_BYTES + 100_000)}, content=b"x")
        self.assertEqual(response.status_code, 413)
        body = b'--testboundary\r\nContent-Disposition: form-data; name="file"; filename="clip.mp4"\r\nContent-Type: video/mp4\r\n\r\n' + b"x" * 80_000 + b'\r\n--testboundary--\r\n'
        async def chunks():
            yield body[:40_000]
            yield body[40_000:]
        with patch.object(main, "MAX_UPLOAD_BYTES", 16):
            response = await self.client.post("/analyze", headers={**HEADERS, "Content-Type": "multipart/form-data; boundary=testboundary"}, content=chunks())
        self.assertEqual(response.status_code, 413)
        self.assertEqual(self.count(), 0)

    async def test_busy_and_retained_result_capacity_are_bounded(self):
        identifier = self.task(status="pending")
        self.assertEqual((await self.upload()).status_code, 429)
        self.store.update(identifier, status="failed")
        for _index in range(main.MAX_TASKS - 1):
            self.task()
        self.assertEqual((await self.upload()).status_code, 503)

    def task(self, owner=OWNER, status="completed", expires=None):
        record, _created = self.store.reserve(owner, str(uuid.uuid4()), "fixture-hash", ".mp4")
        self.store.update(record["task_id"], status=status, expires_at=expires or time.time() + 60, result={"private": True})
        return record["task_id"]

    async def test_status_and_deletion_are_owner_scoped(self):
        identifier = self.task()
        response = await self.client.get(f"/status/{identifier}", headers=HEADERS)
        self.assertEqual(response.status_code, 200)
        for field in ("owner_id", "request_key", "content_hash", "extension", "created_at"):
            self.assertNotIn(field, response.json())
        for method in (self.client.get, self.client.delete):
            self.assertEqual((await method(f"/status/{identifier}", headers={**HEADERS, "X-Athlix-User": OTHER})).status_code, 404)
        self.assertEqual((await self.client.delete(f"/status/{identifier}", headers=HEADERS)).status_code, 204)
        self.assertIsNone(self.store.get(identifier))

    async def test_expired_results_are_inaccessible_and_active_jobs_cannot_be_deleted(self):
        expired = self.task(expires=time.time() - 1)
        self.assertEqual((await self.client.get(f"/status/{expired}", headers=HEADERS)).status_code, 404)
        self.assertIsNone(self.store.get(expired))
        active = self.task(status="processing")
        self.assertEqual((await self.client.delete(f"/status/{active}", headers=HEADERS)).status_code, 409)

    async def test_accepted_upload_has_derived_owner_and_cleans_after_failure(self):
        def fake_process(identifier, path):
            self.assertEqual(self.store.get(identifier)["owner_id"], OWNER)
            self.store.update(identifier, status="failed", error="Invalid video container.")
            Path(path).unlink()
        with patch.object(main, "process_video_background", fake_process):
            response = await self.upload()
        self.assertEqual(response.status_code, 202)
        identifier = response.json()["task_id"]
        self.assertEqual(self.store.get(identifier)["status"], "failed")
        self.assertEqual(list(Path(self.directory.name).glob("*.mp4")), [])

    async def test_worker_timeout_terminates_child_and_deletes_temporary_media(self):
        identifier = self.task(status="pending")
        path = Path(self.directory.name) / f"{identifier}.mp4"
        path.write_bytes(b"video")
        class FakeProcess:
            alive = True
            def start(self): pass
            def join(self, _timeout=None): pass
            def is_alive(self): return self.alive
            def terminate(self): self.alive = False
        process = FakeProcess()
        class FakeContext:
            def Process(self, **_kwargs): return process
        with patch.object(main.multiprocessing, "get_context", return_value=FakeContext()):
            main.process_video_background(identifier, str(path))
        self.assertFalse(process.alive)
        self.assertFalse(path.exists())
        self.assertEqual(self.store.get(identifier)["status"], "failed")
        self.assertIn("time limit", self.store.get(identifier)["error"])
        self.assertTrue(self.store.reserve(OWNER, str(uuid.uuid4()), "new-digest", ".mp4")[1])

    async def test_same_video_retry_reuses_task_but_changed_content_conflicts(self):
        headers = {**HEADERS, "X-Athlix-Request-ID": str(uuid.uuid4())}
        def complete(identifier, path):
            self.store.update(identifier, status="completed", result={"fixture": True})
            Path(path).unlink()
        with patch.object(main, "process_video_background", side_effect=complete) as worker:
            first = await self.upload(headers=headers)
            second = await self.upload(headers=headers)
            changed = await self.upload(headers=headers, data=b"different-video")
        self.assertEqual(first.status_code, 202)
        self.assertEqual(second.json()["task_id"], first.json()["task_id"])
        self.assertEqual(changed.status_code, 409)
        self.assertEqual(worker.call_count, 1)
        self.assertEqual(self.count(), 1)

    async def test_invalid_request_identifier_fails_before_multipart_parsing(self):
        response = await self.client.post("/analyze", headers={**HEADERS, "X-Athlix-Request-ID": "../../injected", "Content-Type": "multipart/form-data"}, content=b"bad")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.count(), 0)

    async def test_restart_preserves_results_marks_interrupted_jobs_failed_and_removes_media(self):
        completed = self.task()
        interrupted = self.task(status="processing")
        raw = Path(self.directory.name) / f"{interrupted}.mp4"
        raw.write_bytes(b"interrupted-private-media")
        restarted = TaskStore(self.store.path)
        with patch.object(main, "STORE", restarted):
            async with main.lifespan(main.app):
                self.assertFalse(raw.exists())
                self.assertEqual(restarted.get(interrupted)["status"], "failed")
                self.assertIn("interrupted", restarted.get(interrupted)["error"])
                self.assertEqual((await self.client.get(f"/status/{completed}", headers=HEADERS)).status_code, 200)
                self.assertEqual((await self.client.get("/ready")).status_code, 200)
        self.assertIsNone(main.INSTANCE_LEASE)


if __name__ == "__main__":
    unittest.main()
