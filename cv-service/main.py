"""Internal CV service. Only the authenticated Node API may submit or read jobs."""
import hmac
import hashlib
import asyncio
from contextlib import asynccontextmanager
import json
import logging
import multiprocessing
import os
from pathlib import Path
import re
import sqlite3
import sys
import tempfile
import time
import uuid

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, Request, UploadFile
from starlette.responses import JSONResponse

from video_safety import MAX_UPLOAD_BYTES, VideoValidationError
from task_store import InstanceLock, TaskStore, TaskStoreError, MAX_RESULT_BYTES

logger = logging.getLogger("athlix.cv")
TEMP_DIR = Path(os.environ.get("CV_TEMP_DIR", Path(tempfile.gettempdir()) / "athlix-cv"))
TEMP_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
JOB_TIMEOUT_SECONDS = 180
TASK_TTL_SECONDS = 15 * 60
MAX_TASKS = 32
STATE_DIR = Path(os.environ.get("CV_STATE_DIR") or Path(tempfile.gettempdir()) / "athlix-cv-state")
STORE = TaskStore(STATE_DIR / "tasks.sqlite3", maximum=MAX_TASKS, ttl=TASK_TTL_SECONDS)
INSTANCE_LEASE = None


class BodyTooLarge(HTTPException):
    def __init__(self):
        super().__init__(413, "Video exceeds the 25 MB upload limit.")


class InternalAuthAndBodyLimit:
    """Authenticate before Starlette parses multipart; bound chunked requests too."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["path"] in ("/", "/ready"):
            return await self.app(scope, receive, send)
        headers = dict(scope["headers"])
        expected = os.environ.get("CV_SERVICE_API_KEY", "")
        if len(expected) < 32:
            return await JSONResponse({"detail": "Video analysis is not configured."}, 503)(scope, receive, send)
        provided = headers.get(b"x-athlix-service-key", b"").decode("latin1")
        owner = headers.get(b"x-athlix-user", b"").decode("latin1")
        if not hmac.compare_digest(provided.encode("utf-8"), expected.encode("utf-8")) or not re.fullmatch(r"[a-f0-9]{24}", owner):
            return await JSONResponse({"detail": "Not authorized."}, 401)(scope, receive, send)
        scope.setdefault("state", {})["owner_id"] = owner
        request_key = headers.get(b"x-athlix-request-id", b"").decode("latin1")
        if request_key and not re.fullmatch(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}", request_key):
            return await JSONResponse({"detail": "Invalid analysis request identifier."}, 400)(scope, receive, send)
        scope["state"]["request_key"] = request_key.lower() if request_key else str(uuid.uuid4())
        body_limit = MAX_UPLOAD_BYTES + 64 * 1024
        try:
            length = int(headers.get(b"content-length", b"0"))
        except ValueError:
            return await JSONResponse({"detail": "Invalid content length."}, 400)(scope, receive, send)
        if length < 0 or length > body_limit:
            return await JSONResponse({"detail": "Video exceeds the 25 MB upload limit."}, 413)(scope, receive, send)
        received = 0

        async def limited_receive():
            nonlocal received
            message = await receive()
            received += len(message.get("body", b""))
            if received > body_limit:
                raise BodyTooLarge()
            return message

        try:
            await self.app(scope, limited_receive, send)
        except BodyTooLarge:
            await JSONResponse({"detail": "Video exceeds the 25 MB upload limit."}, 413)(scope, receive, send)


@asynccontextmanager
async def lifespan(_app):
    global INSTANCE_LEASE
    lease = InstanceLock(STORE.path.parent / "instance.lock")
    lease.acquire()
    INSTANCE_LEASE = lease
    try:
        STORE.recover_interrupted()
        cleanup_media(all_files=True)
        STORE.expire()
    except BaseException:
        INSTANCE_LEASE = None
        lease.release()
        raise
    async def clean_periodically():
        while True:
            try:
                expire_tasks()
                STORE.recover_interrupted(maximum_age=JOB_TIMEOUT_SECONDS + 60)
                cleanup_media()
            except Exception:
                logger.warning("cv_periodic_cleanup_failed")
            await asyncio.sleep(30)
    cleanup = asyncio.create_task(clean_periodically())
    try:
        yield
    finally:
        cleanup.cancel()
        try:
            await cleanup
        except asyncio.CancelledError:
            pass
        INSTANCE_LEASE = None
        lease.release()


app = FastAPI(title="ATHLIX internal Kata analysis", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
app.add_middleware(InternalAuthAndBodyLimit)


def expire_tasks():
    STORE.expire()


def cleanup_media(all_files=False):
    for path in TEMP_DIR.iterdir():
        try:
            if re.fullmatch(r"[a-f0-9-]{36}\.(mp4|mov|avi|webm|json)", path.name) and (all_files or time.time() - path.stat().st_mtime > JOB_TIMEOUT_SECONDS + 60):
                path.unlink(missing_ok=True)
        except FileNotFoundError:
            pass
        except OSError:
            logger.warning("cv_temporary_cleanup_failed")


def run_analysis(file_path, output_path, parent_pid=None):
    """Runs in a child process; the parent enforces a hard wall-clock deadline."""
    try:
        # Docker caps RSS/CPU/PIDs. Linux additionally kills an orphaned native
        # worker when its supervisor dies. No cross-platform RSS cap is claimed.
        if os.name == "posix":
            import resource
            resource.setrlimit(resource.RLIMIT_CPU, (JOB_TIMEOUT_SECONDS, JOB_TIMEOUT_SECONDS + 1))
            resource.setrlimit(resource.RLIMIT_NOFILE, (128, 128))
            if sys.platform.startswith("linux"):
                import ctypes
                import signal
                if ctypes.CDLL(None).prctl(1, signal.SIGKILL) != 0:
                    raise RuntimeError("Could not establish worker lifetime boundary")
                if parent_pid is not None and os.getppid() != parent_pid:
                    return
        from cv.pose_detector import PoseAnalyzer
        from cv.rule_engine import KarateRuleEngine
        from ai.coach import generate_coaching_report

        analyzer = PoseAnalyzer()
        try:
            cv_data = analyzer.analyze_video(file_path)
        finally:
            analyzer.close()
        rule_data = KarateRuleEngine().analyze_movement(cv_data)
        result = {
            **cv_data, **rule_data,
            "ai_report": generate_coaching_report({**rule_data, "quality": cv_data["quality"]}),
            "limitations": [
                "Experimental 2D pose heuristics; no validated accuracy claim.",
                "Camera angle, lighting and occlusion affect results.",
                "This does not measure force, diagnose injury or recognize a kata sequence.",
            ],
        }
        payload = {"result": result}
    except VideoValidationError as exc:
        payload = {"error": str(exc)[:500]}
    except ValueError:
        payload = {"error": "No reliable pose analysis was available. Use a clear clip with your full body visible."}
    except Exception:
        logger.warning("cv_native_processing_failed")
        payload = {"error": "Video processing failed. Please try another clip or contact support."}
    encoded = json.dumps(payload, allow_nan=False)
    if len(encoded.encode("utf-8")) > MAX_RESULT_BYTES:
        encoded = json.dumps({"error": "Analysis output exceeded the result budget. Use a shorter clip."})
    Path(output_path).write_text(encoded, encoding="utf-8")


def process_video_background(task_id, file_path):
    output_path = str(TEMP_DIR / f"{task_id}.json")
    process = None
    try:
        STORE.update(task_id, status="processing", progress=10, message="Estimating visible body landmarks...")
        process = multiprocessing.get_context("spawn").Process(target=run_analysis, args=(file_path, output_path, os.getpid()))
        process.start()
        process.join(JOB_TIMEOUT_SECONDS)
        if process.is_alive():
            process.terminate()
            process.join(5)
            if process.is_alive():
                process.kill()
                process.join()
            raise VideoValidationError("Analysis time limit exceeded. Please use a shorter clip.")
        if not Path(output_path).is_file() or Path(output_path).stat().st_size > MAX_RESULT_BYTES:
            raise VideoValidationError("Analysis could not be completed. Please try another clip.")
        payload = json.loads(Path(output_path).read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise VideoValidationError("Analysis returned an invalid result.")
        if isinstance(payload.get("error"), str):
            STORE.update(task_id, status="failed", error=payload["error"][:500], message="Analysis failed.", expires_at=time.time() + TASK_TTL_SECONDS)
        elif isinstance(payload.get("result"), dict):
            STORE.update(task_id, status="completed", progress=100, result=payload["result"], message="Analysis completed.", expires_at=time.time() + TASK_TTL_SECONDS)
        else:
            raise VideoValidationError("Analysis returned an invalid result.")
    except Exception as exc:
        logger.warning("cv_job_failed")
        message = str(exc) if isinstance(exc, VideoValidationError) else "Analysis could not be completed. Please try again."
        STORE.update(task_id, status="failed", error=message, message="Analysis failed.", expires_at=time.time() + TASK_TTL_SECONDS)
    finally:
        if process is not None and process.is_alive():
            process.terminate()
            process.join()
        for path in (file_path, output_path):
            try:
                Path(path).unlink(missing_ok=True)
            except OSError:
                logger.warning("cv_temporary_cleanup_failed")


@app.get("/")
def health():
    return {"service": "athlix-cv", "mode": "internal", "persistence": "sqlite-single-instance"}


@app.get("/ready")
def readiness():
    try:
        if INSTANCE_LEASE is None or len(os.environ.get("CV_SERVICE_API_KEY", "")) < 32 or not STORE.ready() or not Path(os.environ.get("CV_MODEL_PATH", "pose_landmarker_heavy.task")).is_file():
            raise HTTPException(503, "Video service is not ready.")
    except (OSError, sqlite3.Error):
        raise HTTPException(503, "Video service is not ready.") from None
    return {"ready": True}


@app.post("/analyze", status_code=202)
def analyze_video(request: Request, background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    expire_tasks()
    extension = Path(file.filename or "").suffix.lower()
    allowed = {".mp4": {"video/mp4"}, ".mov": {"video/quicktime"}, ".avi": {"video/x-msvideo", "video/avi"}, ".webm": {"video/webm"}}
    if extension not in allowed or file.content_type not in allowed[extension]:
        raise HTTPException(415, "Use an MP4, MOV, AVI or WebM video with a matching media type.")
    if not Path(os.environ.get("CV_MODEL_PATH", "pose_landmarker_heavy.task")).is_file():
        raise HTTPException(503, "Pose model is not configured. Please contact the operator.")
    path = None
    task_id = None
    reserved = False
    try:
        size = 0
        digest = hashlib.sha256()
        while chunk := file.file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                raise HTTPException(413, "Video exceeds the 25 MB upload limit.")
            digest.update(chunk)
        if size == 0:
            raise HTTPException(400, "The video file is empty.")
        file.file.seek(0)
        task, reserved = STORE.reserve(request.state.owner_id, request.state.request_key, digest.hexdigest(), extension)
        task_id = task["task_id"]
        if not reserved:
            return {"task_id": task_id, "status": task["status"], "message": "Analysis request already accepted."}
        path = TEMP_DIR / f"{task_id}{extension}"
        with path.open("xb") as target:
            while chunk := file.file.read(1024 * 1024):
                target.write(chunk)
        background_tasks.add_task(process_video_background, task_id, str(path))
        return {"task_id": task_id, "status": "pending", "message": "Analysis accepted."}
    except TaskStoreError as exc:
        raise HTTPException(exc.status, str(exc)) from None
    except Exception:
        if path is not None:
            path.unlink(missing_ok=True)
        if reserved:
            STORE.update(task_id, status="failed", error="Video upload could not be completed. Submit a new analysis request.", message="Upload failed.", expires_at=time.time() + TASK_TTL_SECONDS)
        raise
    finally:
        file.file.close()


@app.get("/status/{task_id}")
def get_task_status(task_id: uuid.UUID, request: Request):
    expire_tasks()
    task = STORE.get(str(task_id), request.state.owner_id)
    if task is None:
        raise HTTPException(404, "Task not found or expired.")
    return {key: task[key] for key in ("task_id", "status", "progress", "message", "result", "error", "expires_at")}


@app.delete("/status/{task_id}", status_code=204)
def delete_task(task_id: uuid.UUID, request: Request):
    expire_tasks()
    try:
        STORE.delete(str(task_id), request.state.owner_id)
    except TaskStoreError as exc:
        raise HTTPException(exc.status, str(exc)) from None
