import os
import uuid
import shutil
import threading
import logging
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any

from cv.pose_detector import PoseAnalyzer
from cv.rule_engine import KarateRuleEngine
from ai.coach import generate_coaching_report

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cv-service.main")

app = FastAPI(title="Athlix Karate Kata CV Analyzer Service")

# Enable CORS for Next.js frontend (default dev server on 3000/3002) and Node backend (5000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev simplicity, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

# Memory store for task status. In production, this would be a Redis or DB cache.
# We store task progress, status, and final outputs here.
TASKS: Dict[str, Dict[str, Any]] = {}

def process_video_background(task_id: str, file_path: str):
    """Background task to run OpenCV + MediaPipe + AI Coaching generation."""
    try:
        TASKS[task_id]["status"] = "processing"
        TASKS[task_id]["message"] = "Initializing video frames..."
        
        # 1. Pose estimation
        logger.info(f"Task {task_id}: Starting pose analyzer...")
        analyzer = PoseAnalyzer()
        
        def update_progress(pct: float, msg: str):
            TASKS[task_id]["progress"] = round(pct, 1)
            TASKS[task_id]["message"] = msg
            
        cv_data = analyzer.analyze_video(file_path, progress_callback=update_progress)
        
        # 2. Rule Engine evaluation
        TASKS[task_id]["progress"] = 90.0
        TASKS[task_id]["message"] = "Analyzing karate stances and technique details..."
        logger.info(f"Task {task_id}: Starting karate rule engine...")
        
        rules_engine = KarateRuleEngine()
        rule_data = rules_engine.analyze_movement(cv_data)
        
        # 3. AI Coach report generation
        TASKS[task_id]["progress"] = 95.0
        TASKS[task_id]["message"] = "Generating AI coaching feedback..."
        logger.info(f"Task {task_id}: Calling AI coach generator...")
        
        # Merge stats and scores for coaching summary
        coaching_summary = {
            "kata_recognition": rule_data["kata_recognition"],
            "detected_stances": rule_data["detected_stances"],
            "detected_techniques": rule_data["detected_techniques"],
            "scores": rule_data["scores"],
            "stats": rule_data["stats"]
        }
        
        ai_report = generate_coaching_report(coaching_summary)
        
        # 4. Compile final payload
        final_payload = {
            "task_id": task_id,
            "fps": cv_data["fps"],
            "width": cv_data["width"],
            "height": cv_data["height"],
            "duration": cv_data["duration"],
            "total_frames": cv_data["total_frames"],
            "frames": cv_data["frames"], # contains keypoint sequences
            "stance_segments": rule_data["stance_segments"],
            "technique_segments": rule_data["technique_segments"],
            "kata_recognition": rule_data["kata_recognition"],
            "scores": rule_data["scores"],
            "stats": rule_data["stats"],
            "ai_report": ai_report
        }
        
        TASKS[task_id]["result"] = final_payload
        TASKS[task_id]["status"] = "completed"
        TASKS[task_id]["progress"] = 100.0
        TASKS[task_id]["message"] = "Analysis completed!"
        logger.info(f"Task {task_id}: Completed processing successfully.")
        
    except Exception as e:
        logger.error(f"Error processing video task {task_id}: {str(e)}", exc_info=True)
        TASKS[task_id]["status"] = "failed"
        TASKS[task_id]["error"] = str(e)
        TASKS[task_id]["message"] = f"Error during analysis: {str(e)}"
        
    finally:
        # File cleanup to avoid leaks
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Cleaned up temporary video file: {file_path}")
            except Exception as cleanup_err:
                logger.warning(f"Could not clean up file {file_path}: {str(cleanup_err)}")


@app.get("/")
def read_root():
    return {"message": "Athlix Karate Kata CV Analyzer Service is running."}


@app.post("/analyze")
def analyze_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # Validate format
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".mp4", ".mov", ".avi", ".webm"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Supported formats: {', '.join(allowed_exts)}"
        )
        
    task_id = str(uuid.uuid4())
    temp_file_name = f"{task_id}{ext}"
    temp_file_path = os.path.join(TEMP_DIR, temp_file_name)
    
    # Save uploaded file
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded video: {str(e)}")
        
    # Register task
    TASKS[task_id] = {
        "task_id": task_id,
        "status": "pending",
        "progress": 0.0,
        "message": "Enqueuing video for pose estimation...",
        "result": None,
        "error": None
    }
    
    # Start thread using BackgroundTasks
    background_tasks.add_task(process_video_background, task_id, temp_file_path)
    
    return {
        "task_id": task_id,
        "status": "pending",
        "message": "Analysis started in background."
    }


@app.get("/status/{task_id}")
def get_task_status(task_id: str):
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    return TASKS[task_id]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
