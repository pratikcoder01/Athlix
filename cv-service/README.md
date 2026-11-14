# ATHLIX internal video analysis

The browser calls authenticated Express endpoints under `/api/cv`. Express derives
the owner from the validated, active database account and forwards its ID with an
internal shared secret. Python authenticates those headers **before multipart
parsing**. Do not put this key in frontend configuration. Python has no browser
CORS access and never accepts a caller-selected public account ID.

## Setup

Use Python 3.11 in a fresh virtual environment, then `pip install -r requirements.txt`.
The dependency set uses MediaPipe's Tasks API and a single OpenCV distribution;
the optional legacy pickle classifier is not loaded. Linux hosts need the native
OpenCV runtime libraries (including `libGL` and `libglib2.0`) installed by their
base image. Verify imports in the actual deployment image before enabling analysis.

Set `CV_SERVICE_API_KEY` to the same randomly generated secret of at least 32
characters on Express and Python. Set Express `CV_SERVICE_URL` to the internal
service origin (HTTPS in production, except loopback). Forwarded redirects are
rejected so a redirect cannot disclose the internal key. Python should be private
to the API server's network where the platform supports this.

Provision a reviewed MediaPipe Pose Landmarker Heavy `.task` asset separately and
set Python `CV_MODEL_PATH` to its absolute path. Record the asset version, source,
license and SHA-256 in the deployment change record. Customer requests never
download mutable `latest` assets. Analysis returns 503 until this asset exists;
the checked-in repository does not include a trained kata classifier or model
accuracy evaluation. No model asset or private clip belongs in Git.

Start from this directory:

```sh
uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1 --limit-concurrency 8 --timeout-keep-alive 5
python -m unittest discover -s tests -v
python -m pip check
```

On Windows, use `.venv/Scripts/python.exe`; on Unix, use `.venv/bin/python` after
creating `.venv`. Model import can be checked independently with
`python -c "from cv.pose_detector import PoseAnalyzer"`.

## Resource and privacy policy

- One admitted job, at most 32 retained results, and five submissions per account
  per 15 minutes at Express. Express allows two simultaneous upload requests.
- Files: 25 MB, 60 seconds, at most 60 fps and 1080p. Extension and media type must
  match; OpenCV container/metadata validation and decoding run in an isolated
  child process with a 180-second hard deadline. Declared and chunked HTTP bodies
  have a separate limit before multipart parsing.
- At most 3,600 decoded frames, 600 sampled poses and 640-pixel inference frames.
  No decoded-video frame list is retained. Configure a container memory limit as
  an additional boundary around native decoders and MediaPipe. A malicious native
  decoder can allocate memory before returning a frame; this code does not set a
  cross-platform operating-system RSS cap. Container memory isolation and native
  decoder dependency review remain release gates, even with frame/deadline limits.
- Temporary media and worker output are deleted on success, failure or timeout.
  A 30-second cleanup loop removes interrupted-worker files older than four
  minutes. Use an app-private `CV_TEMP_DIR`, encrypted ephemeral storage and a
  platform request timeout. Raw video is not a permanent user record.
- Completed/failed results expire after 15 minutes and can be deleted by their
  owner using `DELETE /api/cv/status/:id`. Expired results are inaccessible; the
  periodic cleanup loop also removes their in-memory entries.
- Feedback is deterministic local pose feedback. No video, landmarks or metrics
  are sent to an external LLM. The user must explicitly consent before upload.

## Reliability and limitations

This is deliberately a **single worker, single instance, ephemeral** service.
Restarted jobs are lost and status returns 404; the client explains failure and
offers retry. Never scale worker/instance counts while using this process-local
store: deploy a durable queue, shared owner-scoped job store, idempotency keys and
encrypted object storage first. This is a remaining production readiness item.

Low-visibility clips fail rather than receiving plausible default scores. The
heuristic composite normalizes weights over observed components; unobserved guard
or precision is `null`. Timelines use actual sample timestamps. It does not
recognize a kata, measure physical force, diagnose injury or establish model
accuracy. Camera geometry and the heuristic scoring formulas still need a
permissioned evaluation dataset and domain-expert review.

Verification on 2026-11-13: Python API/ownership/resource-policy/scoring tests run
with synthetic fixtures; Express proxy tests use a mocked upstream. Actual
MediaPipe/video inference and an accuracy benchmark are **NOT RUN**: no reviewed
model/permissioned video fixture was provided, and the Windows Application Control
policy blocks matplotlib's `ft2font` DLL during MediaPipe import. Dependency
resolution alone is not evidence that native inference works on the target host.
