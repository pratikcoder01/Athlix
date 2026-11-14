"""Internal CV service. Only the authenticated Node API may submit or read jobs."""
import hmac
import asyncio
from contextlib import asynccontextmanager
import json
import logging
import multiprocessing
import os
from pathlib import Path
import re
import tempfile
import threading
import time
import uuid

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, Request, UploadFile
from starlette.responses import JSONResponse

from video_safety import MAX_UPLOAD_BYTES, VideoValidationError

logger = logging.getLogger("athlix.cv")
TEMP_DIR = Path(os.environ.get("CV_TEMP_DIR", Path(tempfile.gettempdir()) / "athlix-cv"))
TEMP_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
JOB_TIMEOUT_SECONDS = 180
TASK_TTL_SECONDS = 15 * 60
MAX_TASKS = 32
TASKS = {}
TASK_LOCK = threading.Lock()
JOB_SLOT = threading.BoundedSemaphore(1)


class BodyTooLarge(HTTPException):
    def __init__(self):
        super().__init__(413, "Video exceeds the 25 MB upload limit.")


class InternalAuthAndBodyLimit:
    """Authenticate before Starlette parses multipart; bound chunked requests too."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["path"] == "/":
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
    async def clean_periodically():
        while True:
            expire_tasks()
            # Recover temporary media left by a terminated/restarted worker.
            for path in TEMP_DIR.iterdir():
                try:
                    if re.fullmatch(r"[a-f0-9-]{36}\.(mp4|mov|avi|webm|json)", path.name) and time.time() - path.stat().st_mtime > JOB_TIMEOUT_SECONDS + 60:
                        path.unlink(missing_ok=True)
                except FileNotFoundError:
                    pass  # A completed worker removed the file concurrently.
                except OSError:
                    logger.warning("Could not remove an expired CV temporary file", exc_info=True)
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


app = FastAPI(title="ATHLIX internal Kata analysis", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
app.add_middleware(InternalAuthAndBodyLimit)


def expire_tasks():
    now = time.time()
    with TASK_LOCK:
        for task_id, task in list(TASKS.items()):
            if task["status"] in ("completed", "failed") and task["expires_at"] <= now:
                del TASKS[task_id]


def run_analysis(file_path, output_path):
    """Runs in a child process; the parent enforces a hard wall-clock deadline."""
    try:
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
    except (ValueError, VideoValidationError) as exc:
        payload = {"error": str(exc)}
    except Exception:
        logger.exception("Video processing failed")
        payload = {"error": "Video processing failed. Please try another clip or contact support."}
    Path(output_path).write_text(json.dumps(payload, allow_nan=False), encoding="utf-8")


def process_video_background(task_id, file_path):
    output_path = str(TEMP_DIR / f"{task_id}.json")
    process = None
    try:
        with TASK_LOCK:
            TASKS[task_id].update(status="processing", progress=10, message="Estimating visible body landmarks...")
        process = multiprocessing.get_context("spawn").Process(target=run_analysis, args=(file_path, output_path))
        process.start()
        process.join(JOB_TIMEOUT_SECONDS)
        if process.is_alive():
            process.terminate()
            process.join(5)
            if process.is_alive():
                process.kill()
                process.join()
            raise VideoValidationError("Analysis time limit exceeded. Please use a shorter clip.")
        if not Path(output_path).is_file() or Path(output_path).stat().st_size > 32 * 1024 * 1024:
            raise VideoValidationError("Analysis could not be completed. Please try another clip.")
        payload = json.loads(Path(output_path).read_text(encoding="utf-8"))
        with TASK_LOCK:
            task = TASKS[task_id]
            if payload.get("error"):
                task.update(status="failed", error=payload["error"], message="Analysis failed.")
            else:
                task.update(status="completed", progress=100, result=payload["result"], message="Analysis completed.")
            task["expires_at"] = time.time() + TASK_TTL_SECONDS
    except Exception as exc:
        logger.exception("CV job failed")
        message = str(exc) if isinstance(exc, VideoValidationError) else "Analysis could not be completed. Please try again."
        with TASK_LOCK:
            TASKS[task_id].update(status="failed", error=message, message="Analysis failed.", expires_at=time.time() + TASK_TTL_SECONDS)
    finally:
        if process is not None and process.is_alive():
            process.terminate()
            process.join()
        try:
            Path(file_path).unlink(missing_ok=True)
            Path(output_path).unlink(missing_ok=True)
        finally:
            JOB_SLOT.release()


@app.get("/")
def health():
    return {"service": "athlix-cv", "mode": "internal", "persistence": "ephemeral-single-worker"}


@app.post("/analyze", status_code=202)
def analyze_video(request: Request, background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    expire_tasks()
    extension = Path(file.filename or "").suffix.lower()
    allowed = {".mp4": {"video/mp4"}, ".mov": {"video/quicktime"}, ".avi": {"video/x-msvideo", "video/avi"}, ".webm": {"video/webm"}}
    if extension not in allowed or file.content_type not in allowed[extension]:
        raise HTTPException(415, "Use an MP4, MOV, AVI or WebM video with a matching media type.")
    if not Path(os.environ.get("CV_MODEL_PATH", "pose_landmarker_heavy.task")).is_file():
        raise HTTPException(503, "Pose model is not configured. Please contact the operator.")
    with TASK_LOCK:
        if len(TASKS) >= MAX_TASKS:
            raise HTTPException(503, "Analysis capacity is full. Please retry after results expire.")
    if not JOB_SLOT.acquire(blocking=False):
        raise HTTPException(429, "The analyzer is busy. Please retry in a few minutes.")
    task_id = str(uuid.uuid4())
    path = TEMP_DIR / f"{task_id}{extension}"
    try:
        size = 0
        with path.open("xb") as target:
            while chunk := file.file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(413, "Video exceeds the 25 MB upload limit.")
                target.write(chunk)
        if size == 0:
            raise HTTPException(400, "The video file is empty.")
        with TASK_LOCK:
            TASKS[task_id] = {
                "task_id": task_id, "owner_id": request.state.owner_id,
                "status": "pending", "progress": 0, "message": "Waiting for pose estimation...",
                "result": None, "error": None, "expires_at": time.time() + TASK_TTL_SECONDS,
            }
        background_tasks.add_task(process_video_background, task_id, str(path))
        return {"task_id": task_id, "status": "pending", "message": "Analysis accepted."}
    except Exception:
        path.unlink(missing_ok=True)
        JOB_SLOT.release()
        raise
    finally:
        file.file.close()


@app.get("/status/{task_id}")
def get_task_status(task_id: uuid.UUID, request: Request):
    expire_tasks()
    with TASK_LOCK:
        task = TASKS.get(str(task_id))
        if task is None or task["owner_id"] != request.state.owner_id:
            raise HTTPException(404, "Task not found or expired.")
        return {key: value for key, value in task.items() if key != "owner_id"}


@app.delete("/status/{task_id}", status_code=204)
def delete_task(task_id: uuid.UUID, request: Request):
    expire_tasks()
    with TASK_LOCK:
        task = TASKS.get(str(task_id))
        if task is None or task["owner_id"] != request.state.owner_id:
            raise HTTPException(404, "Task not found or expired.")
        if task["status"] not in ("completed", "failed"):
            raise HTTPException(409, "Wait for analysis to finish before deleting its result.")
        del TASKS[str(task_id)]
