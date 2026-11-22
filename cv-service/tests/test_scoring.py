import math
import unittest
from types import SimpleNamespace

from video_safety import has_confident_pose, validate_metadata, VideoValidationError
from cv.rule_engine import KarateRuleEngine
from ai.coach import generate_coaching_report


def frame(timestamp):
    landmarks = [{"x": 0.0, "y": 0.0, "z": 0.0, "visibility": 1.0} for _ in range(33)]
    landmarks[11]["x"], landmarks[12]["x"] = -0.2, 0.2
    landmarks[27]["x"], landmarks[28]["x"] = -0.15, 0.15
    return {"timestamp": timestamp, "landmarks": landmarks, "world_landmarks": landmarks,
            "metrics": {"balance_sway": 0.05, "angles": {"left_knee": 170, "right_knee": 170, "left_elbow": 90, "right_elbow": 90},
                        "velocities": {"left_wrist": 0, "right_wrist": 0, "left_ankle": 0, "right_ankle": 0}}}


class ScoringTests(unittest.TestCase):
    def test_occluded_malformed_and_nonfinite_landmarks_are_not_scored(self):
        landmarks = [SimpleNamespace(x=0.1, y=0.2, z=0.3, visibility=0.9) for _ in range(33)]
        self.assertTrue(has_confident_pose(landmarks, landmarks))
        self.assertFalse(has_confident_pose(landmarks[:20], landmarks))
        landmarks[15].visibility = 0.2
        self.assertFalse(has_confident_pose(landmarks, landmarks))
        landmarks[15].visibility = 0.9
        landmarks[15].x = math.nan
        self.assertFalse(has_confident_pose(landmarks, landmarks))

    def test_metadata_rejects_nonfinite_unknown_and_resource_exhaustion(self):
        for values in [(0, 30, 640, 480), (math.nan, 30, 640, 480), (30, 0, 640, 480), (61, 100, 640, 480), (30, 1801, 640, 480), (30, 30, 4096, 2160)]:
            with self.subTest(values=values), self.assertRaises(VideoValidationError):
                validate_metadata(*values)
        self.assertEqual(validate_metadata(30, 1800, 1920, 1080)["duration"], 60)

    def test_no_confident_metrics_cannot_receive_default_score(self):
        for data in ({"frames": []}, {"frames": [{"metrics": {}}]}):
            with self.assertRaises(ValueError):
                KarateRuleEngine().analyze_movement(data)

    def test_sampled_timelines_use_real_timestamps_and_unobserved_precision_is_not_invented(self):
        data = {"fps": 30, "duration": 1.0, "frames": [frame(index / 10) for index in range(10)]}
        result = KarateRuleEngine().analyze_movement(data)
        self.assertEqual(result["stance_segments"][0]["end_time"], 1.0)
        self.assertIsNone(result["scores"]["precision"])
        self.assertEqual(result["score_formula"]["available_weight"], 0.75)
        scores = result["scores"]
        self.assertEqual(scores["overall"], int((scores["stability"] * 0.25 + scores["guard"] * 0.15 + scores["symmetry"] * 0.2 + scores["velocity"] * 0.15) / 0.75))
        self.assertEqual(result["kata_recognition"]["confidence"], 0)
        self.assertEqual(result, KarateRuleEngine().analyze_movement(data))

    def test_feedback_uses_observations_without_fabricated_recognition_or_provider_calls(self):
        summary = KarateRuleEngine().analyze_movement({"fps": 30, "duration": 1.0, "frames": [frame(index / 10) for index in range(10)]})
        report = generate_coaching_report(summary)
        self.assertEqual(report["source"], "local_pose_heuristics")
        self.assertIn("No kata sequence was recognized", report["overall_feedback"])
        self.assertNotIn("timing_score", report)
        self.assertNotIn("power_score", report)


if __name__ == "__main__":
    unittest.main()
