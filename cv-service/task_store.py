"""Bounded owner-scoped SQLite job state for one service instance and worker."""
from contextlib import contextmanager
import json
import os
from pathlib import Path
import sqlite3
import time
import uuid

ACTIVE = ("pending", "processing")
MAX_RESULT_BYTES = 16 * 1024 * 1024


class TaskStoreError(Exception):
    def __init__(self, status, message):
        self.status = status
        super().__init__(message)


class InstanceLock:
    """An OS-owned lease releases even when the process is forcibly terminated."""
    def __init__(self, path):
        self.path = Path(path)
        self.handle = None

    def acquire(self):
        self.path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        handle = self.path.open("a+b")
        try:
            if self.path.stat().st_size == 0:
                handle.write(b"0")
                handle.flush()
            handle.seek(0)
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except (OSError, BlockingIOError):
            handle.close()
            raise RuntimeError("CV state is already owned by another worker; run one instance and one worker.") from None
        self.handle = handle

    def release(self):
        if self.handle is not None:
            self.handle.close()
            self.handle = None


class TaskStore:
    def __init__(self, path, maximum=32, ttl=900, clock=None):
        self.path = Path(path)
        self.path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        self.maximum = maximum
        self.ttl = ttl
        self.clock = clock or time.time
        with self.connection() as db:
            db.execute("PRAGMA auto_vacuum=INCREMENTAL")
            db.execute("PRAGMA journal_mode=DELETE")
            db.execute("""CREATE TABLE IF NOT EXISTS tasks (
                task_id TEXT PRIMARY KEY, owner_id TEXT NOT NULL,
                request_key TEXT NOT NULL, content_hash TEXT NOT NULL,
                extension TEXT NOT NULL, created_at REAL NOT NULL,
                expires_at REAL NOT NULL, status TEXT NOT NULL,
                progress INTEGER NOT NULL, message TEXT NOT NULL,
                error TEXT, result TEXT,
                UNIQUE(owner_id,request_key)
            )""")
            db.execute("CREATE INDEX IF NOT EXISTS task_expiry ON tasks(status,expires_at)")
        try:
            self.path.chmod(0o600)
        except OSError:
            if os.name != "nt":
                raise

    @contextmanager
    def connection(self, write=False):
        db = sqlite3.connect(self.path, timeout=5, isolation_level=None)
        db.row_factory = sqlite3.Row
        try:
            db.execute("PRAGMA secure_delete=ON")
            db.execute("PRAGMA synchronous=FULL")
            if write:
                db.execute("BEGIN IMMEDIATE")
            yield db
            if write:
                db.execute("COMMIT")
        except BaseException:
            if write and db.in_transaction:
                db.execute("ROLLBACK")
            raise
        finally:
            db.close()

    @staticmethod
    def decode(row):
        if row is None:
            return None
        value = dict(row)
        value["result"] = json.loads(value["result"]) if value["result"] is not None else None
        return value

    def reserve(self, owner, request_key, content_hash, extension):
        now = self.clock()
        with self.connection(write=True) as db:
            db.execute("DELETE FROM tasks WHERE status IN ('completed','failed') AND expires_at<=?", (now,))
            row = db.execute("SELECT * FROM tasks WHERE owner_id=? AND request_key=?", (owner, request_key)).fetchone()
            if row:
                if row["content_hash"] != content_hash or row["extension"] != extension:
                    raise TaskStoreError(409, "This analysis request was already used for a different video. Start a new request.")
                return self.decode(row), False
            if db.execute("SELECT COUNT(*) FROM tasks WHERE status IN ('pending','processing')").fetchone()[0]:
                raise TaskStoreError(429, "The analyzer is busy. Please retry in a few minutes.")
            if db.execute("SELECT COUNT(*) FROM tasks").fetchone()[0] >= self.maximum:
                raise TaskStoreError(503, "Analysis capacity is full. Please retry after results expire.")
            identifier = str(uuid.uuid4())
            db.execute("""INSERT INTO tasks(task_id,owner_id,request_key,content_hash,extension,created_at,
                expires_at,status,progress,message) VALUES(?,?,?,?,?,?,?,'pending',0,?)""",
                (identifier, owner, request_key, content_hash, extension, now, now + self.ttl, "Waiting for pose estimation..."))
            return self.decode(db.execute("SELECT * FROM tasks WHERE task_id=?", (identifier,)).fetchone()), True

    def get(self, identifier, owner=None):
        with self.connection() as db:
            row = db.execute("SELECT * FROM tasks WHERE task_id=?" + (" AND owner_id=?" if owner else ""),
                             (identifier, owner) if owner else (identifier,)).fetchone()
            if row and row["status"] not in ACTIVE and row["expires_at"] <= self.clock():
                return None
            return self.decode(row)

    def update(self, identifier, **fields):
        if not fields or not set(fields).issubset({"status", "progress", "message", "error", "result", "expires_at"}):
            raise ValueError("Invalid task-state update")
        if "result" in fields:
            fields["result"] = json.dumps(fields["result"], allow_nan=False, separators=(",", ":")) if fields["result"] is not None else None
            if fields["result"] is not None and len(fields["result"].encode("utf-8")) > MAX_RESULT_BYTES:
                raise ValueError("Analysis output exceeds the retained-result budget")
        with self.connection(write=True) as db:
            db.execute("UPDATE tasks SET " + ",".join(f"{key}=?" for key in fields) + " WHERE task_id=?", (*fields.values(), identifier))

    def expire(self):
        with self.connection(write=True) as db:
            db.execute("DELETE FROM tasks WHERE status IN ('completed','failed') AND expires_at<=?", (self.clock(),))
        with self.connection() as db:
            db.execute("PRAGMA incremental_vacuum(256)")

    def recover_interrupted(self, maximum_age=None):
        now = self.clock()
        with self.connection(write=True) as db:
            query = "SELECT task_id FROM tasks WHERE status IN ('pending','processing')"
            args = ()
            if maximum_age is not None:
                query += " AND created_at<?"
                args = (now - maximum_age,)
            identifiers = [row[0] for row in db.execute(query, args)]
            for identifier in identifiers:
                db.execute("UPDATE tasks SET status='failed',error=?,message='Analysis interrupted.',result=NULL,expires_at=? WHERE task_id=?",
                           ("Analysis was interrupted. Please submit a new analysis request.", now + self.ttl, identifier))
            return identifiers

    def delete(self, identifier, owner):
        with self.connection(write=True) as db:
            row = db.execute("SELECT status,expires_at FROM tasks WHERE task_id=? AND owner_id=?", (identifier, owner)).fetchone()
            if row is None or row["expires_at"] <= self.clock():
                raise TaskStoreError(404, "Task not found or expired.")
            if row["status"] in ACTIVE:
                raise TaskStoreError(409, "Wait for analysis to finish before deleting its result.")
            db.execute("DELETE FROM tasks WHERE task_id=? AND owner_id=?", (identifier, owner))

    def ready(self):
        with self.connection() as db:
            return db.execute("SELECT name FROM sqlite_master WHERE name='tasks'").fetchone() is not None
