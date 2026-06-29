import os
import joblib
import numpy as np
import mediapipe as mp
import cv2

mp_pose = mp.solutions.pose

class CustomKataClassifier:
    def __init__(self, model_dir: str = "training/models"):
        self.model = None
        self.scaler = None
        self.label_encoder = None
        self.pose_estimator = None
        
        self.load_models(model_dir)
    
    def load_models(self, model_dir: str):
        try:
            self.model = joblib.load(os.path.join(model_dir, "kata_classifier.pkl"))
            self.scaler = joblib.load(os.path.join(model_dir, "scaler.pkl"))
            self.label_encoder = joblib.load(os.path.join(model_dir, "label_encoder.pkl"))
            
            self.pose_estimator = mp_pose.Pose(
                min_detection_confidence=0.8,
                min_tracking_confidence=0.8
            )
            print("✅ Custom models loaded successfully!")
        except FileNotFoundError:
            print("⚠️ Custom models not found, using default rule-based system")
            self.model = None
    
    def extract_features_from_frames(self, frames: list) -> np.ndarray:
        all_features = []
        
        for frame in frames:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose_estimator.process(rgb)
            
            if results.pose_landmarks:
                row = []
                for lm in results.pose_landmarks.landmark:
                    row.extend([lm.x, lm.y, lm.z, lm.visibility])
                all_features.append(row)
        
        if len(all_features) > 0:
            mean_feat = np.mean(all_features, axis=0)
            std_feat = np.std(all_features, axis=0)
            return np.concatenate([mean_feat, std_feat]).reshape(1, -1)
        return None
    
    def predict(self, frames: list):
        if self.model is None:
            return None
        
        features = self.extract_features_from_frames(frames)
        if features is None:
            return None
        
        # Scale features
        scaled_features = self.scaler.transform(features)
        
        # Predict
        prediction_proba = self.model.predict_proba(scaled_features)[0]
        predicted_idx = np.argmax(prediction_proba)
        predicted_label = self.label_encoder.inverse_transform([predicted_idx])[0]
        confidence = prediction_proba[predicted_idx]
        
        return {
            "label": predicted_label,
            "confidence": float(confidence),
            "all_probabilities": dict(zip(
                self.label_encoder.classes_,
                [float(p) for p in prediction_proba]
            ))
        }
