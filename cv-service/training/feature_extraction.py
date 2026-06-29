import cv2
import mediapipe as mp
import pandas as pd
import os
import numpy as np
import random
from tqdm import tqdm

mp_pose = mp.solutions.pose

def extract_pose_features_from_frame(frame: np.ndarray, pose_estimator) -> np.ndarray:
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose_estimator.process(rgb)
    
    if results.pose_landmarks:
        row = []
        for lm in results.pose_landmarks.landmark:
            row.extend([lm.x, lm.y, lm.z, lm.visibility])
        return np.array(row)
    return None

def extract_video_features(video_path: str):
    cap = cv2.VideoCapture(video_path)
    all_features = []
    
    with mp_pose.Pose(
        min_detection_confidence=0.8,
        min_tracking_confidence=0.8
    ) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            features = extract_pose_features_from_frame(frame, pose)
            if features is not None:
                all_features.append(features)
    
    cap.release()
    
    if len(all_features) > 0:
        # Use mean features for the whole video
        mean_features = np.mean(all_features, axis=0)
        std_features = np.std(all_features, axis=0)
        return np.concatenate([mean_features, std_features])
    return None

def create_feature_dataset(
    raw_videos_dir: str,
    output_csv: str,
    max_videos_per_class: int = 100
):
    data = []
    labels = []
    
    # Collect all video files
    video_files = [f for f in os.listdir(raw_videos_dir) 
                   if f.endswith(('.mp4', '.avi', '.mov'))]
    random.shuffle(video_files)
    
    class_counts = {}
    
    print(f"🔍 Found {len(video_files)} videos to process")
    
    for filename in tqdm(video_files, desc="Extracting Features"):
        # Extract label from filename
        label = filename.split("_")[0]
        
        if label not in class_counts:
            class_counts[label] = 0
        if class_counts[label] >= max_videos_per_class:
            continue
        
        video_path = os.path.join(raw_videos_dir, filename)
        
        try:
            features = extract_video_features(video_path)
            if features is not None:
                data.append(features)
                labels.append(label)
                class_counts[label] += 1
        except Exception as e:
            print(f"⚠️ Error processing {filename}: {e}")
    
    if len(data) == 0:
        print("❌ No valid features extracted!")
        return
    
    # Create DataFrame
    feature_cols = [f"feat_{i}" for i in range(len(data[0]))]
    df = pd.DataFrame(data, columns=feature_cols)
    df["label"] = labels
    
    df.to_csv(output_csv, index=False)
    print(f"\n✅ Dataset saved to {output_csv}")
    print(f"📊 Samples: {len(df)}, Classes: {len(df['label'].unique())}")
    print("📈 Class counts:")
    print(df['label'].value_counts())

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("❌ Usage: python feature_extraction.py <videos_dir> [output_csv]")
        print("Example: python feature_extraction.py augmented_videos features.csv")
        sys.exit(1)
    
    videos_dir = sys.argv[1]
    output_csv = sys.argv[2] if len(sys.argv) > 3 else "features.csv"
    create_feature_dataset(videos_dir, output_csv)
