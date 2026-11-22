import math
import unittest
from cv.geometry import calculate_angle_3d


class GeometryTests(unittest.TestCase):
    def test_known_angles(self):
        for point, expected in [([1, 0, 0], 0), ([0, 1, 0], 90), ([-1, 0, 0], 180)]:
            self.assertAlmostEqual(calculate_angle_3d([1, 0, 0], [0, 0, 0], point), expected)

    def test_translation_and_scale_invariance(self):
        self.assertAlmostEqual(calculate_angle_3d([5, 2, 3], [1, 2, 3], [1, 6, 3]), 90)
        self.assertAlmostEqual(calculate_angle_3d([0, 0, 2], [0, 0, 0], [0, 2, 0]), 90)

    def test_uncertain_geometry_is_rejected(self):
        for a, b, c in [([0, 0, 0], [0, 0, 0], [1, 0, 0]), ([1e-10, 0, 0], [0, 0, 0], [1, 0, 0]), ([math.nan, 0, 0], [0, 0, 0], [1, 0, 0]), ([math.inf, 0, 0], [0, 0, 0], [1, 0, 0]), ([1, 0], [0, 0, 0], [1, 0, 0]), (None, [0, 0, 0], [1, 0, 0])]:
            with self.subTest(a=a), self.assertRaises(ValueError):
                calculate_angle_3d(a, b, c)
