"""Shared video resource policy; imports OpenCV only when decoding is needed."""
import math

MAX_UPLOAD_BYTES = 25 * 1024 * 1024
MAX_DURATION_SECONDS = 60
MAX_FRAMES = 3600
MAX_ANALYSIS_FRAMES = 600
MAX_DIMENSION = 1920
MAX_PIXELS = 1920 * 1080
MAX_FPS = 60


def has_confident_pose(landmarks, world_landmarks):
    essential = (0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28)
    if len(landmarks) != 33 or len(world_landmarks) != 33:
        return False
    if not all((landmarks[index].visibility or 0) >= 0.6 for index in essential):
        return False
    return all(math.isfinite(value) for landmark in [*landmarks, *world_landmarks] for value in (landmark.x, landmark.y, landmark.z))


class VideoValidationError(ValueError):
    pass


def validate_metadata(fps, frame_count, width, height):
    values = (fps, frame_count, width, height)
    if not all(math.isfinite(value) and value > 0 for value in values):
        raise VideoValidationError("Invalid video metadata. Export a standard video with a known frame rate and duration.")
    if fps > MAX_FPS or frame_count > MAX_FRAMES:
        raise VideoValidationError("Use a video at 60 fps or less and no more than 60 seconds.")
    if width > MAX_DIMENSION or height > MAX_DIMENSION or width * height > MAX_PIXELS:
        raise VideoValidationError("Video resolution exceeds 1080p. Please export a smaller clip.")
    if frame_count / fps > MAX_DURATION_SECONDS:
        raise VideoValidationError("Video duration exceeds 60 seconds.")
    return {"fps": float(fps), "total_frames": int(frame_count), "width": int(width), "height": int(height), "duration": frame_count / fps}


def validate_video(path):
    import cv2
    capture = cv2.VideoCapture(str(path))
    try:
        if not capture.isOpened():
            raise VideoValidationError("This file could not be decoded as a video.")
        fps = capture.get(cv2.CAP_PROP_FPS)
        count = capture.get(cv2.CAP_PROP_FRAME_COUNT)
        width = capture.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = capture.get(cv2.CAP_PROP_FRAME_HEIGHT)
        # Browser-recorded WebM may omit frame count. Scan it within the same
        # decode budget and hard subprocess deadline rather than invent metadata.
        if not math.isfinite(count) or count <= 0:
            validate_metadata(fps, 1, width, height)
            count = 0
            while capture.isOpened():
                ok, frame = capture.read()
                if not ok:
                    break
                count += 1
                if count > MAX_FRAMES or count / fps > MAX_DURATION_SECONDS:
                    raise VideoValidationError("Decoded video exceeds the 60-second frame budget.")
                if frame.shape[0] * frame.shape[1] > MAX_PIXELS or max(frame.shape[:2]) > MAX_DIMENSION:
                    raise VideoValidationError("Decoded video resolution exceeds 1080p.")
        return validate_metadata(fps, count, width, height)
    finally:
        capture.release()
