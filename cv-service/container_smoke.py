"""CI-only acceptance of the fixed local CV Compose project; not an accuracy test.

The workflow must build/start ``-p athlix-cv-ci`` first and supply a dummy
CV_SERVICE_API_KEY plus the provisioned CV_MODEL_HOST_PATH. This script never
creates a deployment or selects a user-provided host/project. It restarts only
that disposable project's ``cv`` service and removes only its own terminal job.
"""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import uuid

import cv2
import httpx
import numpy as np


PROJECT = "athlix-cv-ci"
SERVICE = "cv"
ORIGIN = "http://127.0.0.1:8000"
OWNER = "507f1f77bcf86cd799439011"
FOREIGN_OWNER = "507f1f77bcf86cd799439012"
COMPOSE_FILE = Path(__file__).resolve().with_name("compose.yaml")
MEMORY_BYTES = 1536 * 1024 * 1024
COMPOSE = ["docker", "compose", "-f", str(COMPOSE_FILE), "-p", PROJECT]


class SmokeFailure(Exception):
    """Messages are fixed diagnostics, never raw provider/command output."""


def require(condition, message):
    if not condition:
        raise SmokeFailure(message)


def docker(arguments, timeout=30):
    try:
        result = subprocess.run(arguments, check=False, capture_output=True,
                                text=True, timeout=timeout, cwd=COMPOSE_FILE.parent)
    except (OSError, subprocess.SubprocessError):
        raise SmokeFailure("The fixed CI Docker operation did not finish.") from None
    # Compose diagnostics/inspect output may contain interpolated credentials.
    # Keep all captured output private and emit only selected validated facts.
    require(result.returncode == 0, "The fixed CI Docker operation failed.")
    return result.stdout


def container_id():
    identifiers = docker([*COMPOSE, "ps", "-q", SERVICE]).split()
    require(len(identifiers) == 1, "Expected one running CV container in the CI project.")
    identifier = identifiers[0]
    require(len(identifier) == 64 and all(character in "0123456789abcdef" for character in identifier),
            "Docker returned an invalid CI container identifier.")
    return identifier


def inspect(identifier):
    try:
        records = json.loads(docker(["docker", "inspect", identifier]))
        require(isinstance(records, list) and len(records) == 1, "Invalid container inspection result.")
        record = records[0]
        labels = record.get("Config", {}).get("Labels", {})
        require(labels.get("com.docker.compose.project") == PROJECT and
                labels.get("com.docker.compose.service") == SERVICE,
                "Refusing a container outside the fixed disposable CV project.")
        return record
    except (ValueError, TypeError, AttributeError, KeyError):
        raise SmokeFailure("Docker returned an invalid inspection result.") from None


def verify_runtime(identifier):
    record = inspect(identifier)
    host = record.get("HostConfig", {})
    require(record.get("State", {}).get("Running") is True, "The CV container is not running.")
    require(record.get("Config", {}).get("User") == "10001:10001", "The CV image must use its dedicated nonroot user.")
    require(host.get("Memory") == MEMORY_BYTES, "The CV memory cap must be 1536 MiB.")
    nano_cpus = host.get("NanoCpus", 0)
    quota, period = host.get("CpuQuota", 0), host.get("CpuPeriod", 0)
    require(nano_cpus == 2_000_000_000 or (period and quota == 2 * period), "The CV CPU cap must be two CPUs.")
    require(host.get("PidsLimit") == 64, "The CV process cap must be 64 PIDs.")
    require(host.get("ReadonlyRootfs") is True, "The CV container root must be read-only.")
    require(host.get("Privileged") is False, "The CV container must not be privileged.")
    require("ALL" in host.get("CapDrop", []), "The CV container must drop all Linux capabilities.")
    require(any(option in ("no-new-privileges", "no-new-privileges:true")
                for option in host.get("SecurityOpt", [])), "The CV container must prevent privilege escalation.")
    bindings = host.get("PortBindings", {}).get("8000/tcp", [])
    require(len(bindings) == 1 and bindings[0].get("HostIp") == "127.0.0.1" and
            bindings[0].get("HostPort") == "8000", "The CV test port must bind only to fixed loopback port 8000.")
    mounts = record.get("Mounts", [])
    require(any(mount.get("Destination") == "/var/lib/athlix-cv" and mount.get("Type") == "volume" and
                mount.get("RW") is True and mount.get("Name", "").startswith(PROJECT + "_") for mount in mounts),
            "CV task state must use the disposable project's persistent volume.")
    require(any(mount.get("Destination") == "/models/pose.task" and mount.get("RW") is False for mount in mounts),
            "The pose model mount must be read-only.")
    try:
        identity = json.loads(docker(["docker", "exec", identifier, "python", "-c",
                                      "import json,os; print(json.dumps({'uid':os.geteuid(),'gid':os.getegid()}))"]))
        require(identity == {"uid": 10001, "gid": 10001}, "The running CV process environment must be nonroot.")
    except (ValueError, TypeError):
        raise SmokeFailure("The running CV identity check returned an invalid result.") from None
    return {"uid": 10001, "memory_bytes": MEMORY_BYTES, "cpus": 2, "pids": 64,
            "read_only_root": True, "all_capabilities_dropped": True, "no_new_privileges": True}


def get_json(response, expected_status, message):
    require(response.status_code == expected_status, message)
    try:
        value = response.json()
    except ValueError:
        raise SmokeFailure("The CV service returned invalid JSON.") from None
    require(isinstance(value, dict), "The CV service returned an invalid response shape.")
    return value


def wait_ready(client, identifier, seconds=90):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        try:
            response = client.get("/ready")
            ready = response.status_code == 200 and response.json().get("ready") is True
        except (httpx.HTTPError, ValueError, AttributeError):
            ready = False
        health = inspect(identifier).get("State", {}).get("Health", {}).get("Status")
        if ready and health == "healthy":
            return
        time.sleep(1)
    raise SmokeFailure("The fixed CV service did not become ready and Docker-healthy within the deadline.")


def write_blank_video(path):
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"MJPG"), 10, (320, 240))
    require(writer.isOpened(), "The CI host cannot encode the generated AVI fixture.")
    try:
        frame = np.zeros((240, 320, 3), dtype=np.uint8)
        for _ in range(20):
            writer.write(frame)
    finally:
        writer.release()
    require(path.is_file() and 0 < path.stat().st_size < 1024 * 1024,
            "The generated AVI fixture is empty or unexpectedly large.")


def submit(client, path, headers):
    with path.open("rb") as source:
        body = get_json(client.post("/analyze", headers=headers,
                                    files={"file": ("blank.avi", source, "video/x-msvideo")}),
                        202, "The CV service did not accept the generated AVI fixture.")
    identifier = body.get("task_id")
    try:
        parsed = uuid.UUID(identifier)
        require(parsed.version == 4 and str(parsed) == identifier, "The CV service returned an invalid task identifier.")
    except (ValueError, TypeError, AttributeError):
        raise SmokeFailure("The CV service returned an invalid task identifier.") from None
    return identifier


def wait_for_blank_rejection(client, task_id, headers):
    deadline = time.monotonic() + 180
    while time.monotonic() < deadline:
        body = get_json(client.get(f"/status/{task_id}", headers=headers), 200,
                        "The owner could not retrieve its accepted job.")
        if body.get("status") in ("failed", "completed"):
            require(body.get("status") == "failed" and body.get("result") is None,
                    "Blank video must not receive fabricated athlete scores.")
            error = body.get("error", "")
            require(isinstance(error, str) and
                    ("No reliable pose analysis was available" in error or "confident full-body poses" in error),
                    "Blank video did not reach the expected low-confidence native inference result.")
            return body
        require(body.get("status") in ("pending", "processing"), "The CV job returned an invalid state.")
        time.sleep(1)
    raise SmokeFailure("The generated blank-video job did not finish within 180 seconds.")


def main():
    require(os.environ.get("CI") == "true", "This fixed-project container acceptance script runs only in CI.")
    require(not os.environ.get("DOCKER_CONTEXT") or os.environ["DOCKER_CONTEXT"] == "default",
            "Refusing a nondefault Docker context.")
    require(not os.environ.get("DOCKER_HOST") or os.environ["DOCKER_HOST"] == "unix:///var/run/docker.sock",
            "Refusing a remote Docker daemon.")
    require(docker(["docker", "context", "show"]).strip() == "default", "Refusing a nondefault Docker context.")
    secret = os.environ.get("CV_SERVICE_API_KEY", "")
    require(len(secret) >= 32, "Provide the CI-only service credential through the environment.")
    require(COMPOSE_FILE.is_file(), "The fixed CV Compose configuration is missing.")
    identifier = container_id()
    runtime = verify_runtime(identifier)
    headers = {"x-athlix-service-key": secret, "x-athlix-user": OWNER,
               "x-athlix-request-id": str(uuid.uuid4())}
    foreign = {**headers, "x-athlix-user": FOREIGN_OWNER}
    task_id = None
    with httpx.Client(base_url=ORIGIN, follow_redirects=False,
                      timeout=httpx.Timeout(8, connect=3), trust_env=False) as client:
        try:
            wait_ready(client, identifier)
            health = get_json(client.get("/"), 200, "The fixed CV liveness endpoint failed.")
            require(health.get("service") == "athlix-cv" and health.get("persistence") == "sqlite-single-instance",
                    "The fixed loopback endpoint is not the expected persistent CV service.")
            with tempfile.TemporaryDirectory(prefix="athlix-cv-container-smoke-") as directory:
                path = Path(directory) / "blank.avi"
                write_blank_video(path)
                task_id = submit(client, path, headers)
                terminal = wait_for_blank_rejection(client, task_id, headers)
                require(client.get(f"/status/{task_id}", headers=foreign).status_code == 404,
                        "Foreign owners must not read this job.")
                require(client.delete(f"/status/{task_id}", headers=foreign).status_code == 404,
                        "Foreign owners must not delete this job.")
                docker([*COMPOSE, "restart", "--timeout", "20", SERVICE], timeout=45)
                restarted = container_id()
                verify_runtime(restarted)
                wait_ready(client, restarted)
                restored = get_json(client.get(f"/status/{task_id}", headers=headers), 200,
                                    "The owner's completed job did not survive service restart.")
                require(restored == terminal, "The persisted terminal job changed across service restart.")
                require(submit(client, path, headers) == task_id,
                        "Retrying the same request/video after restart must return the original job.")
                require(client.get(f"/status/{task_id}", headers=foreign).status_code == 404,
                        "Restart must preserve job owner isolation.")
                require(client.delete(f"/status/{task_id}", headers=headers).status_code == 204,
                        "The owner could not delete its terminal job.")
                require(client.get(f"/status/{task_id}", headers=headers).status_code == 404,
                        "The deleted terminal job is still visible.")
                task_id = None
        finally:
            # On a failed assertion, attempt removal of this script's own job
            # only. An active job correctly rejects deletion with 409.
            if task_id is not None:
                try:
                    client.delete(f"/status/{task_id}", headers=headers)
                except httpx.HTTPError:
                    pass
    print(json.dumps({"container_acceptance": "passed", "project": PROJECT,
                      "runtime": runtime, "docker_health": "healthy",
                      "native_blank_video_rejected": True, "terminal_job_survived_restart": True,
                      "owner_isolation": True, "idempotent_retry_after_restart": True,
                      "owner_result_cleanup": True, "accuracy_evaluated": False}))


if __name__ == "__main__":
    try:
        main()
    except SmokeFailure as error:
        print(json.dumps({"container_acceptance": "failed", "reason": str(error)}))
        raise SystemExit(1) from None
    except Exception:
        # HTTP errors can retain headers; raw Docker output includes Config.Env.
        # Neither belongs in CI logs, even for a disposable test credential.
        print(json.dumps({"container_acceptance": "failed", "reason": "Unexpected container acceptance failure; inspect controlled service logs."}))
        raise SystemExit(1) from None
