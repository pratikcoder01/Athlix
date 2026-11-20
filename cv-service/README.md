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
uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1 --limit-concurrency 4 --timeout-keep-alive 5
python -m unittest discover -s tests -v
python -m pip check
```

On Windows, use `.venv/Scripts/python.exe`; on Unix, use `.venv/bin/python` after
creating `.venv`. Model import can be checked independently with
`python -c "from cv.pose_detector import PoseAnalyzer"`.

## Resource and privacy policy

- One atomically admitted job, at most 32 retained results (16 MiB each), and five submissions per account
  per 15 minutes at Express. Express allows two simultaneous upload requests.
- Files: 25 MB, 60 seconds, at most 60 fps and 1080p. Extension and media type must
  match; OpenCV container/metadata validation and decoding run in an isolated
  child process with a 180-second hard deadline. Linux additionally applies a CPU
  deadline, an open-file limit and parent-death termination. Declared and chunked HTTP bodies
  have a separate limit before multipart parsing.
- At most 3,600 decoded frames, 600 sampled poses and 640-pixel inference frames.
  No decoded-video frame list is retained. Configure a container memory limit as
  an additional boundary around native decoders and MediaPipe. A malicious native
  decoder can allocate memory before returning a frame; this code does not set a
  cross-platform operating-system RSS cap. The supplied Compose configuration
  enforces a 1,536 MiB container cap, two CPUs and 64 PIDs. Actual deployment must
  retain equivalent platform limits; native decoder dependency review remains
  necessary even with frame/deadline limits.
- Temporary media and worker output are deleted on success, failure or timeout.
  Startup immediately removes interrupted-worker media after obtaining an
  exclusive instance lock; a 30-second loop removes orphan files older than four
  minutes. Use an app-private `CV_TEMP_DIR`, encrypted ephemeral storage and a
  platform request timeout. Raw video is not a permanent user record.
- Completed/failed results expire after 15 minutes and can be deleted by their
  owner using `DELETE /api/cv/status/:id`. Expired results are inaccessible; the
  periodic cleanup loop also deletes their SQLite rows. SQLite uses secure-delete
  and rollback-journal mode to reduce leftover payload pages; this is not a
  guarantee of physical erasure from host disks, snapshots or backups. Configure
  backup access/retention separately and never describe the API TTL as deletion
  from every platform backup.
- Feedback is deterministic local pose feedback. No video, landmarks or metrics
  are sent to an external LLM. The user must explicitly consent before upload.

## Reliability and limitations

This is a **single worker, single instance** service with a bounded SQLite store.
Set `CV_STATE_DIR` to an application-private persistent local volume; only that
volume makes completed results survive deployment/host restarts. The development
default in the system temporary directory is not a hosted durability guarantee.
An OS-owned exclusive instance lock rejects a second worker against that state.
SQLite transactions serialize admission, capacity and per-owner idempotency.

The browser supplies a UUID per selected upload; Express validates/forwards it
with the derived account identity. Python calculates the bounded file's SHA-256
and returns the same task for an identical owner/request/video retry. Reusing the
request UUID for different content or extension returns 409. Direct internal
callers without a key receive a new request, preserving the previous API contract.

Completed results survive reopening the database until their original expiry.
Pending/processing jobs are marked **failed** on restart, with an explicit retry
message; private raw media is removed. Interrupted work is not silently re-run.
The UI starts a new job after a confirmed terminal failure and preserves a request
key after uncertain transport failures so a retry can discover an accepted job.
Never scale this design to multiple instances or network filesystems. A shared
queue/object-store design remains separate work if horizontal scaling is needed.

`GET /` is liveness. `GET /ready` additionally requires the instance lease, the
SQLite schema, the service credential and a provisioned model file; it does not
claim that native inference or model quality was evaluated.

## Container and hosting template

`Dockerfile` runs as UID/GID 10001 with one worker and pinned Python requirements.
By default, the image contains no model and does not download one. Provision the
manifest-pinned model with `provision_model.py` outside the image, then supply its
absolute path as `CV_MODEL_HOST_PATH` and a server-only `CV_SERVICE_API_KEY` to the
Compose template. The model is mounted
read-only; SQLite uses a named volume. Root filesystem writes are disabled;
temporary media uses a 160 MiB private tmpfs. Verify mounted state ownership for
UID 10001 before accepting traffic. These files do not start a service themselves.

For hosts that cannot mount an operator's local model file, the image has an
explicit build-time option:

```sh
docker build --build-arg CV_BUILD_PROVISION_MODEL=true -t athlix-cv:review ./cv-service
docker run --rm --network none athlix-cv:review python native_smoke.py
```

Run these commands from the repository root. The opt-in downloads only the
versioned URL in `model-manifest.json`, verifies its exact size and SHA-256,
and includes the public weights at `/models/pose.task`, readable by UID 10001.
Unknown flag values fail the build. A download or checksum failure also fails
the build; no replacement or request-time fallback occurs. Review the recorded
model source, model-card license statement and release approval before opting in;
the manifest does not establish legal approval or ATHLIX accuracy. Builds contact
the upstream model host for public weights; athlete media is never involved.

The Render template sets auto-deploy **off**, one instance, Docker runtime and a
1 GiB persistent disk. It explicitly enables this build option and fixes
`CV_MODEL_PATH=/models/pose.task`, so `/ready` does not depend on a file on the
operator's computer. Render forwards the flag from `envVars` to the Docker build
argument. The flag is public configuration; do not put secrets in build arguments.
The declared `1c-2g` compute plan is a deployment template, not an approved purchase.
Render's persistent disk prevents horizontal scaling and zero-downtime deploys;
expect and test a restart interruption rather than advertising seamless recovery.
Render's platform resource limits replace Compose-specific limits on that host.

Configuration references checked during this change:
[Docker Compose service resource/security options](https://docs.docker.com/reference/compose-file/services/),
[Render Blueprint fields](https://render.com/docs/blueprint-spec),
[Render Docker environment/build-argument mapping](https://render.com/docs/docker),
[Render persistent-disk limitations](https://render.com/docs/disks), and
[Render compute-plan identifiers](https://render.com/docs/compute-plans).

Low-visibility clips fail rather than receiving plausible default scores. The
heuristic composite normalizes weights over observed components; unobserved guard
or precision is `null`. Timelines use actual sample timestamps. It does not
recognize a kata, measure physical force, diagnose injury or establish model
accuracy. Camera geometry and the heuristic scoring formulas still need a
permissioned evaluation dataset and domain-expert review.

Verification updated 2026-11-21: the current local suite passes 37 Python
API/ownership/resource-policy/scoring/provisioning tests. Express proxy tests
use a mocked upstream. Windows Application Control blocks a native dependency
DLL locally; that policy was not bypassed. At pushed commit `8bea3de`, both remote
Python jobs passed 30 then-current regressions, hash-pinned model provisioning,
actual native inference on generated blank video and low-confidence rejection.
The actual constrained Docker service passed owner isolation, retries, deletion
and persisted results after restart. See the linked runs in
[verification](../docs/VERIFICATION.md). These synthetic/runtime checks do not
establish a permissioned human-video accuracy or usefulness benchmark, and do not
prove acceptance on the intended live Render service.
The opt-in image-build provisioning and mount-free native smoke path require a
fresh CI run; they have not run locally because no Docker daemon is available.
The SQLite tests additionally exercise concurrent independent connections,
idempotency, TTL after reopening, result-size/nonfinite rejection, secure-delete
payload removal, startup recovery and an actual killed-process lock release.
Later source changes need a fresh final CI run. Hosted persistent-disk/model/
resource configuration still requires target-environment acceptance; passing CI
does not establish that a live service has those settings.
