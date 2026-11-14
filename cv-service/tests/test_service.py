import os
from pathlib import Path
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
import uuid

import httpx
import main

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
        main.TASKS.clear()
        main.JOB_SLOT = threading.BoundedSemaphore(1)
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=main.app), base_url="http://cv.test")

    async def asyncTearDown(self):
        await self.client.aclose()
        self.temp_patch.stop()
        self.environment.stop()
        self.directory.cleanup()

    async def upload(self, data=b"not-real-video", filename="clip.mp4", media="video/mp4", headers=None):
        return await self.client.post("/analyze", headers=headers or HEADERS, files={"file": (filename, data, media)})

    async def test_authentication_fails_before_upload_parsing(self):
        response = await self.client.post("/analyze", content=b"broken multipart", headers={"Content-Type": "multipart/form-data"})
        self.assertEqual(response.status_code, 401)
        self.assertEqual(main.TASKS, {})
        self.assertEqual(list(Path(self.directory.name).glob("*.mp4")), [])
        for headers in ({**HEADERS, "X-Athlix-Service-Key": "wrong"}, {**HEADERS, "X-Athlix-User": "../../user"}):
            self.assertEqual((await self.upload(headers=headers)).status_code, 401)

    async def test_missing_configuration_fails_closed(self):
        with patch.dict(os.environ, {"CV_SERVICE_API_KEY": ""}):
            self.assertEqual((await self.upload()).status_code, 503)
        self.model.unlink()
        self.assertEqual((await self.upload()).status_code, 503)

    async def test_mime_and_extension_must_match(self):
        self.assertEqual((await self.upload(filename="clip.exe")).status_code, 415)
        self.assertEqual((await self.upload(media="image/png")).status_code, 415)

    async def test_empty_and_oversize_upload_clean_files_and_release_capacity(self):
        self.assertEqual((await self.upload(data=b"")).status_code, 400)
        with patch.object(main, "MAX_UPLOAD_BYTES", 16):
            self.assertEqual((await self.upload(data=b"x" * 17)).status_code, 413)
        self.assertEqual(list(Path(self.directory.name).glob("*.mp4")), [])
        self.assertEqual(main.TASKS, {})
        self.assertTrue(main.JOB_SLOT.acquire(blocking=False))
        main.JOB_SLOT.release()

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
        self.assertEqual(main.TASKS, {})

    async def test_busy_and_retained_result_capacity_are_bounded(self):
        main.JOB_SLOT.acquire()
        self.assertEqual((await self.upload()).status_code, 429)
        main.JOB_SLOT.release()
        for index in range(main.MAX_TASKS):
            main.TASKS[str(index)] = {"status": "completed", "expires_at": time.time() + 60}
        self.assertEqual((await self.upload()).status_code, 503)

    def task(self, owner=OWNER, status="completed", expires=None):
        identifier = str(uuid.uuid4())
        main.TASKS[identifier] = {"task_id": identifier, "owner_id": owner, "status": status, "expires_at": expires or time.time() + 60, "result": {"private": True}}
        return identifier

    async def test_status_and_deletion_are_owner_scoped(self):
        identifier = self.task()
        response = await self.client.get(f"/status/{identifier}", headers=HEADERS)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("owner_id", response.json())
        for method in (self.client.get, self.client.delete):
            self.assertEqual((await method(f"/status/{identifier}", headers={**HEADERS, "X-Athlix-User": OTHER})).status_code, 404)
        self.assertEqual((await self.client.delete(f"/status/{identifier}", headers=HEADERS)).status_code, 204)
        self.assertNotIn(identifier, main.TASKS)

    async def test_expired_results_are_inaccessible_and_active_jobs_cannot_be_deleted(self):
        expired = self.task(expires=time.time() - 1)
        self.assertEqual((await self.client.get(f"/status/{expired}", headers=HEADERS)).status_code, 404)
        self.assertNotIn(expired, main.TASKS)
        active = self.task(status="processing")
        self.assertEqual((await self.client.delete(f"/status/{active}", headers=HEADERS)).status_code, 409)

    async def test_accepted_upload_has_derived_owner_and_cleans_after_failure(self):
        def fake_process(identifier, path):
            self.assertEqual(main.TASKS[identifier]["owner_id"], OWNER)
            main.TASKS[identifier].update(status="failed", error="Invalid video container.")
            Path(path).unlink()
            main.JOB_SLOT.release()
        with patch.object(main, "process_video_background", fake_process):
            response = await self.upload()
        self.assertEqual(response.status_code, 202)
        identifier = response.json()["task_id"]
        self.assertEqual(main.TASKS[identifier]["status"], "failed")
        self.assertEqual(list(Path(self.directory.name).glob("*.mp4")), [])

    async def test_worker_timeout_terminates_child_and_deletes_temporary_media(self):
        identifier = self.task(status="pending")
        path = Path(self.directory.name) / f"{identifier}.mp4"
        path.write_bytes(b"video")
        main.JOB_SLOT.acquire()
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
        self.assertEqual(main.TASKS[identifier]["status"], "failed")
        self.assertIn("time limit", main.TASKS[identifier]["error"])
        self.assertTrue(main.JOB_SLOT.acquire(blocking=False))
        main.JOB_SLOT.release()


if __name__ == "__main__":
    unittest.main()
