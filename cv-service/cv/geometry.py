"""Pure pose geometry, independently testable without a native inference runtime."""
import math


def calculate_angle_3d(a, b, c):
    """Angle at b in degrees; reject missing, nonfinite or collapsed limbs."""
    try:
        points = [[float(value) for value in point] for point in (a, b, c)]
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError("Pose joint coordinates are invalid.") from exc
    if any(len(point) != 3 or not all(math.isfinite(value) for value in point) for point in points):
        raise ValueError("Pose joints require three finite coordinates.")
    ba = [points[0][i] - points[1][i] for i in range(3)]
    bc = [points[2][i] - points[1][i] for i in range(3)]
    norm_a, norm_c = math.hypot(*ba), math.hypot(*bc)
    if min(norm_a, norm_c) < 1e-8 or not math.isfinite(norm_a * norm_c):
        raise ValueError("Pose limb geometry is too uncertain to score.")
    cosine = sum(ba[i] * bc[i] for i in range(3)) / (norm_a * norm_c)
    return math.degrees(math.acos(max(-1.0, min(1.0, cosine))))
