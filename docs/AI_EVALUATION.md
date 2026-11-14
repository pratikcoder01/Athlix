# Kata feedback evaluation plan

Status 2026-11-14: evaluation protocol, not completed benchmark results. No
accuracy, customer outcome, validated official score or model moat is asserted.

## Current evidence

The service estimates visible 2D pose landmarks and derives bounded heuristic
metrics. Low-confidence/malformed poses fail rather than receiving plausible
default scores. Tests use synthetic fixtures to check resource policy, timestamps,
owner isolation and deterministic score calculations. These tests cannot measure
real-world landmark accuracy or coaching usefulness. Native inference in the
Windows review was blocked by Application Control and a reviewed model/video
fixture was unavailable.

## Before a coaching-quality claim

1. Obtain permission for every clip and annotation, including appropriate review
   for minors. Define retention/deletion and access before collection.
2. Freeze the model file hash, runtime versions, inference settings, camera
   protocol, metric formulas and failure thresholds in a versioned run manifest.
3. Define the task precisely: landmark error, metric repeatability, visibility
   rejection or coach-rated usefulness. A composite heuristic score is not
   classifier accuracy and must not be reported as such.
4. Have qualified independent coaches annotate the required observations, record
   disagreements, and predefine how uncertain labels are handled.
5. Split evaluation by athlete/session/site, keeping augmentations of the same
   source clip in the same partition. Prevent person and near-duplicate leakage.
6. Evaluate camera angles, body visibility, clothing, lighting, frame rates,
   assistive needs and relevant participant variation. Publish rejection/error
   coverage as well as selected successful examples.
7. Report sample counts, exclusion reasons, uncertainty intervals, subgroup
   limitations, failure cases, run costs and runtime/resource measurements.
8. Preserve a reproducible script and consent-compatible result artifacts. Have
   domain experts review whether the feedback helps rather than merely scoring
   well on a chosen formula.

Do not present unmeasured force, injury prevention, a kata classification, a
federation judging score or a specific accuracy percentage as established output.
