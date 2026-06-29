import cv2
import os
import numpy as np
from typing import List, Callable
import random

class VideoAugmenter:
    def __init__(self):
        self.augmentations = [
            ("flip_horizontal", self.flip_horizontal),
            ("rotate_small", self.rotate_small),
            ("zoom", self.zoom),
            ("brightness", self.brightness),
            ("contrast", self.contrast),
            ("add_noise", self.add_noise),
            ("speed", self.speed),
        ]
    
    def flip_horizontal(self, frame):
        return cv2.flip(frame, 1)
    
    def rotate_small(self, frame, max_angle=10):
        h, w = frame.shape[:2]
        center = (w//2, h//2)
        angle = random.uniform(-max_angle, max_angle)
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(frame, matrix, (w, h))
    
    def zoom(self, frame, zoom_range=(0.85, 1.15)):
        h, w = frame.shape[:2]
        zoom_factor = random.uniform(zoom_range[0], zoom_range[1])
        new_w, new_h = int(w * zoom_factor), int(h * zoom_factor)
        frame = cv2.resize(frame, (new_w, new_h))
        cx, cy = new_w//2, new_h//2
        x1, y1 = max(0, cx - w//2), max(0, cy - h//2)
        x2, y2 = x1 + w, y1 + h
        return frame[y1:y2, x1:x2]
    
    def brightness(self, frame, range=0.2):
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        value = hsv[:, :, 2]
        value = np.clip(value * random.uniform(1 - range, 1 + range), 0, 255)
        hsv[:, :, 2] = value.astype(np.uint8)
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    
    def contrast(self, frame, range=0.2):
        alpha = random.uniform(1 - range, 1 + range)
        return cv2.convertScaleAbs(frame, alpha=alpha, beta=0)
    
    def add_noise(self, frame, std_dev=5):
        mean = 0
        noise = np.random.normal(mean, std_dev, frame.shape).astype(np.int16)
        frame = np.clip(frame + noise, 0, 255).astype(np.uint8)
        return frame
    
    def augment_video(self, input_path: str, output_dir: str, num_augmentations: int = 5):
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            print(f"❌ Could not open: {input_path}")
            return
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        basename = os.path.basename(input_path).replace(".mp4", ""))
        
        # Read all frames first
        frames = []
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
        cap.release()
        
        for aug_idx = 0
        while aug_idx < num_augmentations:
            aug_name, aug_func = random.choice(self.augmentations)
            output_filename = f"{basename}_aug_{aug_name}_{aug_idx}.mp4"
            output_path = os.path.join(output_dir, output_filename)
            
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
            
            for frame in frames:
                augmented_frame = aug_func(frame)
                out.write(augmented_frame)
            out.release()
            print(f"✅ Generated: {output_filename}")
            aug_idx += 1
        print(f"✅ {num_augmentations} augmentations done for {basename}")

def augment_dataset(input_dir: str, output_dir: str, num_augmentations: int = 5):
    os.makedirs(output_dir, exist_ok=True)
    
    augmenter = VideoAugmenter()
    
    for filename in os.listdir(input_dir):
        if filename.endswith((".mp4", ".avi", ".mov")):
            input_path = os.path.join(input_dir, filename)
            print(f"\nProcessing: {filename}")
            augmenter.augment_video(input_path, output_dir, num_augmentations)

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python data_augmentation.py <input_dir> <output_dir> [num_augmentations]")
        print("Example: python data_augmentation.py ../data_collection/raw_videos augmented_videos 5")
        sys.exit(1)
    
    input_dir = sys.argv[1]
    output_dir = sys.argv[2]
    num_aug = 5 if len(sys.argv) == 4 else int(sys.argv[3])
    augment_dataset(input_dir, output_dir, num_aug)
