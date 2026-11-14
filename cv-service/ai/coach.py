"""Deterministic feedback from observed metrics; sends no video or metrics to an LLM."""


def generate_coaching_report(summary):
    scores = summary["scores"]
    strengths, improvements, recommendations = [], [], []
    metrics = (
        ("stability", "Low estimated trunk sway in the sampled poses.", "Review trunk movement with a qualified coach.", "Practice slow stance transitions while keeping the full body visible."),
        ("guard", "Hands were usually above the hips between detected actions.", "Hands were observed below the hips between detected actions.", "Review guard positions for your discipline with a coach."),
        ("symmetry", "Left and right joint angles were relatively similar.", "Left and right joint angles differed in the sampled poses.", "Check whether the observed asymmetry is intentional for your technique."),
    )
    for key, positive, negative, tip in metrics:
        if scores[key] is None:
            improvements.append(f"Insufficient observations to score {key}.")
            continue
        if scores[key] >= 80:
            strengths.append(positive)
        else:
            improvements.append(negative)
            recommendations.append(tip)
    if not strengths:
        strengths.append("The clip contains enough visible body landmarks for exploratory feedback.")
    return {
        "source": "local_pose_heuristics",
        "strengths": strengths,
        "improvements": improvements,
        "recommendations": recommendations or ["Compare these observations with feedback from a qualified coach."],
        "overall_feedback": (
            f"The experimental composite score is {scores['overall']}/100. "
            "It summarizes sampled pose heuristics, not measured athletic ability or model accuracy. "
            "No kata sequence was recognized. Camera angle and visibility affect every metric; "
            "this feedback does not measure physical force or provide medical advice."
        ),
    }
