"""Real native/model runtime check on generated non-person video; not an accuracy benchmark."""
import hashlib
import json
import os
from pathlib import Path
import tempfile
import cv2
import numpy as np
from cv.pose_detector import PoseAnalyzer


def main():
    manifest = json.loads(Path(__file__).with_name("model-manifest.json").read_text(encoding="utf-8"))
    model = Path(os.environ["CV_MODEL_PATH"])
    if hashlib.sha256(model.read_bytes()).hexdigest() != manifest["sha256"]:
        raise AssertionError("Native test requires the pinned model")
    with tempfile.TemporaryDirectory(prefix="athlix-native-") as directory:
        path = str(Path(directory) / "blank.avi")
        writer = cv2.VideoWriter(path, cv2.VideoWriter_fourcc(*"MJPG"), 10, (320, 240))
        if not writer.isOpened():
            raise AssertionError("Native video encoder unavailable")
        try:
            for _ in range(20):
                writer.write(np.zeros((240, 320, 3), dtype=np.uint8))
        finally:
            writer.release()
        analyzer = PoseAnalyzer()
        try:
            try:
                analyzer.analyze_video(path)
            except ValueError as error:
                if "confident full-body poses" not in str(error):
                    raise
            else:
                raise AssertionError("Blank video must not receive fabricated human scores")
        finally:
            analyzer.close()
    print(json.dumps({"native_model_load_and_inference": "passed", "blank_video_rejected": True, "model_sha256": manifest["sha256"], "accuracy_evaluated": False}))


if __name__ == "__main__":
    main()
