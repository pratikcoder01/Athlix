from concurrent.futures import ThreadPoolExecutor
import math
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import uuid
from unittest.mock import patch

from task_store import InstanceLock, TaskStore, TaskStoreError

OWNER = "507f1f77bcf86cd799439011"
OTHER = "507f1f77bcf86cd799439012"


class TaskStoreTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.path = Path(self.directory.name) / "tasks.sqlite3"
        self.now = 1000.0
        self.store = TaskStore(self.path, maximum=2, ttl=900, clock=lambda: self.now)

    def tearDown(self):
        self.directory.cleanup()

    def reserve(self, owner=OWNER, key=None):
        return self.store.reserve(owner, key or str(uuid.uuid4()), "fixed-content-hash", ".mp4")

    def test_only_one_concurrent_job_across_independent_connections(self):
        def attempt(_index):
            try:
                return TaskStore(self.path).reserve(OWNER, str(uuid.uuid4()), "digest", ".mp4")[1]
            except TaskStoreError as exc:
                return exc.status
        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(attempt, range(8)))
        self.assertEqual(results.count(True), 1)
        self.assertEqual(results.count(429), 7)

    def test_duplicate_request_is_owner_and_content_scoped(self):
        key = str(uuid.uuid4())
        first, created = self.reserve(key=key)
        self.assertTrue(created)
        same, created = self.reserve(key=key)
        self.assertFalse(created)
        self.assertEqual(same["task_id"], first["task_id"])
        with self.assertRaises(TaskStoreError) as mismatch:
            self.store.reserve(OWNER, key, "different-hash", ".mp4")
        self.assertEqual(mismatch.exception.status, 409)
        self.assertIsNone(self.store.get(first["task_id"], OTHER))
        self.store.update(first["task_id"], status="failed")
        other, created = self.reserve(owner=OTHER, key=key)
        self.assertTrue(created)
        self.assertNotEqual(other["task_id"], first["task_id"])

    def test_capacity_expiry_and_results_survive_reopening(self):
        first, _ = self.reserve()
        self.store.update(first["task_id"], status="completed", result={"private": "retained"})
        second, _ = self.reserve()
        self.store.update(second["task_id"], status="failed")
        with self.assertRaises(TaskStoreError) as full:
            self.reserve()
        self.assertEqual(full.exception.status, 503)
        restarted = TaskStore(self.path, clock=lambda: self.now)
        self.assertEqual(restarted.get(first["task_id"])["result"], {"private": "retained"})
        self.now += 901
        self.assertIsNone(restarted.get(first["task_id"]))
        restarted.expire()
        with restarted.connection() as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM tasks").fetchone()[0], 0)
        self.assertTrue(self.reserve()[1])

    def test_stale_recovery_reports_failure_without_invented_results(self):
        active, _ = self.reserve()
        self.store.update(active["task_id"], status="processing")
        self.assertEqual(self.store.recover_interrupted(maximum_age=240), [])
        self.now += 241
        self.assertEqual(self.store.recover_interrupted(maximum_age=240), [active["task_id"]])
        failed = self.store.get(active["task_id"])
        self.assertEqual(failed["status"], "failed")
        self.assertIsNone(failed["result"])
        self.assertEqual(failed["expires_at"], self.now + 900)

    def test_nonfinite_or_oversized_result_cannot_be_retained(self):
        active, _ = self.reserve()
        with self.assertRaises(ValueError):
            self.store.update(active["task_id"], result={"score": math.nan})
        with patch("task_store.MAX_RESULT_BYTES", 10), self.assertRaises(ValueError):
            self.store.update(active["task_id"], result={"too_large": "payload"})
        self.assertIsNone(self.store.get(active["task_id"])["result"])

    def test_owner_delete_zeroes_payload_pages_and_rejects_another_owner(self):
        row, _ = self.reserve()
        marker = "sensitive-fixture-result-unique-39732321"
        self.store.update(row["task_id"], status="completed", result={"marker": marker})
        with self.assertRaises(TaskStoreError) as rejected:
            self.store.delete(row["task_id"], OTHER)
        self.assertEqual(rejected.exception.status, 404)
        self.store.delete(row["task_id"], OWNER)
        self.assertNotIn(marker.encode(), self.path.read_bytes())

    def test_instance_lock_prevents_another_process_and_releases_after_crash(self):
        lock_path = self.path.parent / "instance.lock"
        script = "from task_store import InstanceLock; import sys,time; lease=InstanceLock(sys.argv[1]); lease.acquire(); print('ready',flush=True); time.sleep(30)"
        process = subprocess.Popen([sys.executable, "-c", script, str(lock_path)], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            self.assertEqual(process.stdout.readline().strip(), "ready")
            lease = InstanceLock(lock_path)
            with self.assertRaises(RuntimeError):
                lease.acquire()
        finally:
            process.kill()
            process.communicate(timeout=5)
        lease = InstanceLock(lock_path)
        lease.acquire()
        lease.release()

    def test_committed_state_survives_actual_writer_process_crash(self):
        script = "from task_store import TaskStore; import sys,os; store=TaskStore(sys.argv[1]); row,_=store.reserve(sys.argv[2],'crash-fixture','digest','.mp4'); store.update(row['task_id'],status='processing'); print(row['task_id'],flush=True); os._exit(17)"
        process = subprocess.run([sys.executable, "-c", script, str(self.path), OWNER], capture_output=True, text=True, timeout=10)
        self.assertEqual(process.returncode, 17)
        identifier = process.stdout.strip()
        reopened = TaskStore(self.path)
        self.assertEqual(reopened.get(identifier, OWNER)["status"], "processing")
        self.assertEqual(reopened.recover_interrupted(), [identifier])
        self.assertEqual(reopened.get(identifier, OWNER)["status"], "failed")
        self.assertIsNone(reopened.get(identifier, OWNER)["result"])


if __name__ == "__main__":
    unittest.main()
