import cv2
import mediapipe as mp
import numpy as np
import os
import math
import urllib.request
from typing import Dict, List, Any, Callable

# Modern MediaPipe Tasks API Imports
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"
MODEL_PATH = "pose_landmarker_full.task"

def ensure_model_exists():
    """Download the Pose Landmarker task model file if it does not exist locally."""
    if not os.path.exists(MODEL_PATH):
        print(f"Downloading pose landmarker model from Google storage: {MODEL_URL}...")
        try:
            # Create a simple download progress callback
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
            print(f"Model saved successfully to {MODEL_PATH}")
        except Exception as e:
            raise IOError(f"Failed to download MediaPipe model: {str(e)}")

def calculate_angle_3d(a: List[float], b: List[float], c: List[float]) -> float:
    """Calculate the 3D angle (in degrees) at joint 'b' between points 'a' and 'c'."""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    
    ba = a - b
    bc = c - b
    
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    
    return float(np.degrees(angle))

class PoseAnalyzer:
    def __init__(self):
        ensure_model_exists()
        
        # Configure modern MediaPipe options
        base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            output_segmentation_masks=False,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.landmarker = vision.PoseLandmarker.create_from_options(options)

    def analyze_video(self, video_path: str, progress_callback: Callable[[float, str], None] = None) -> Dict[str, Any]:
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
            
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")
            
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        if fps <= 0 or total_frames <= 0:
            fps = 30.0
            total_frames = 100
            
        duration = total_frames / fps
        
        # Decide frame step to limit rate to ~30fps max
        frame_step = 1
        if fps > 35:
            frame_step = int(round(fps / 30.0))
            
        frames_data = []
        frame_index = 0
        processed_frames_count = 0
        
        prev_world_landmarks = None
        
        if progress_callback:
            progress_callback(0.0, "Extracting video frames and initializing pose tracking...")
            
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_index % frame_step != 0:
                frame_index += 1
                continue
                
            timestamp = frame_index / fps
            timestamp_ms = int(timestamp * 1000)
            
            # MediaPipe expects RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            
            # Detect using modern VIDEO mode landmarker
            detection_result = self.landmarker.detect_for_video(mp_image, timestamp_ms)
            
            frame_entry = {
                "frame_index": frame_index,
                "timestamp": round(timestamp, 3),
                "landmarks": None,
                "world_landmarks": None,
                "metrics": {}
            }
            
            # Check if person was detected
            if detection_result.pose_landmarks and len(detection_result.pose_landmarks) > 0:
                pose_lms = detection_result.pose_landmarks[0]
                world_pose_lms = detection_result.pose_world_landmarks[0]
                
                # 1. Store normalized landmarks for frontend rendering
                norm_lms = []
                for lm in pose_lms:
                    norm_lms.append({
                        "x": round(lm.x, 4),
                        "y": round(lm.y, 4),
                        "z": round(lm.z, 4),
                        "visibility": round(lm.visibility, 4)
                    })
                frame_entry["landmarks"] = norm_lms
                
                # 2. Store world landmarks for calculations
                world_lms = []
                for lm in world_pose_lms:
                    world_lms.append({
                        "x": round(lm.x, 4),
                        "y": round(lm.y, 4),
                        "z": round(lm.z, 4),
                        "visibility": round(lm.visibility, 4)
                    })
                frame_entry["world_landmarks"] = world_lms
                
                # Helper arrays for angle calculation
                def pt(idx):
                    return [world_pose_lms[idx].x, world_pose_lms[idx].y, world_pose_lms[idx].z]
                
                l_elbow_ang = calculate_angle_3d(pt(11), pt(13), pt(15))
                r_elbow_ang = calculate_angle_3d(pt(12), pt(14), pt(16))
                
                l_knee_ang = calculate_angle_3d(pt(23), pt(25), pt(27))
                r_knee_ang = calculate_angle_3d(pt(24), pt(26), pt(28))
                
                l_hip_ang = calculate_angle_3d(pt(11), pt(23), pt(25))
                r_hip_ang = calculate_angle_3d(pt(12), pt(24), pt(26))
                
                l_shoulder_ang = calculate_angle_3d(pt(23), pt(11), pt(13))
                r_shoulder_ang = calculate_angle_3d(pt(24), pt(12), pt(14))
                
                # 3. Calculate Center of Gravity (CoG)
                left_hip = pt(23)
                right_hip = pt(24)
                left_shoulder = pt(11)
                right_shoulder = pt(12)
                
                cog_x = (left_hip[0] + right_hip[0]) * 0.35 + (left_shoulder[0] + right_shoulder[0]) * 0.15
                cog_y = (left_hip[1] + right_hip[1]) * 0.35 + (left_shoulder[1] + right_shoulder[1]) * 0.15
                cog_z = (left_hip[2] + right_hip[2]) * 0.35 + (left_shoulder[2] + right_shoulder[2]) * 0.15
                
                # 4. Velocities (m/s)
                velocities = {
                    "left_wrist": 0.0,
                    "right_wrist": 0.0,
                    "left_ankle": 0.0,
                    "right_ankle": 0.0,
                    "cog": 0.0
                }
                
                if prev_world_landmarks:
                    dt = timestamp - prev_world_landmarks["timestamp"]
                    if dt > 0:
                        pwl = prev_world_landmarks["wl"]
                        
                        def dist_3d(p1, p2):
                            return math.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2 + (p1[2]-p2[2])**2)
                            
                        velocities["left_wrist"] = round(dist_3d(pt(15), [pwl[15].x, pwl[15].y, pwl[15].z]) / dt, 2)
                        velocities["right_wrist"] = round(dist_3d(pt(16), [pwl[16].x, pwl[16].y, pwl[16].z]) / dt, 2)
                        velocities["left_ankle"] = round(dist_3d(pt(27), [pwl[27].x, pwl[27].y, pwl[27].z]) / dt, 2)
                        velocities["right_ankle"] = round(dist_3d(pt(28), [pwl[28].x, pwl[28].y, pwl[28].z]) / dt, 2)
                        
                        prev_cog = prev_world_landmarks["cog"]
                        velocities["cog"] = round(dist_3d([cog_x, cog_y, cog_z], prev_cog) / dt, 2)
                
                prev_world_landmarks = {
                    "timestamp": timestamp,
                    "wl": world_pose_lms,
                    "cog": [cog_x, cog_y, cog_z]
                }
                
                base_x = (pt(27)[0] + pt(28)[0]) / 2.0
                balance_sway = round(abs(cog_x - base_x), 3)
                
                frame_entry["metrics"] = {
                    "angles": {
                        "left_elbow": round(l_elbow_ang, 1),
                        "right_elbow": round(r_elbow_ang, 1),
                        "left_knee": round(l_knee_ang, 1),
                        "right_knee": round(r_knee_ang, 1),
                        "left_hip": round(l_hip_ang, 1),
                        "right_hip": round(r_hip_ang, 1),
                        "left_shoulder": round(l_shoulder_ang, 1),
                        "right_shoulder": round(r_shoulder_ang, 1)
                    },
                    "cog": [round(cog_x, 3), round(cog_y, 3), round(cog_z, 3)],
                    "balance_sway": balance_sway,
                    "velocities": velocities
                }
                
            frames_data.append(frame_entry)
            frame_index += 1
            processed_frames_count += 1
            
            if progress_callback and processed_frames_count % 15 == 0:
                pct = min(90.0, (frame_index / total_frames) * 90.0)
                progress_callback(pct, f"Estimating body poses: frame {frame_index}/{total_frames} ({int(pct)}%)...")
                
        cap.release()
        
        valid_frames = [f for f in frames_data if f["landmarks"] is not None]
        if len(valid_frames) == 0:
            raise ValueError("No human person detected in the video. Please make sure the whole body is visible and well-lit.")
            
        return {
            "fps": fps,
            "width": width,
            "height": height,
            "duration": round(duration, 2),
            "total_frames": total_frames,
            "frames": frames_data
        }
