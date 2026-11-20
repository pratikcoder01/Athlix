"""Explicit operator/CI/opt-in image-build provisioning; never called by a customer request."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import tempfile
import urllib.request

MANIFEST = json.loads(Path(__file__).with_name("model-manifest.json").read_text(encoding="utf-8"))


def provision(output):
    output = Path(output).resolve()
    if output.exists():
        if output.stat().st_size != MANIFEST["bytes"] or hashlib.sha256(output.read_bytes()).hexdigest() != MANIFEST["sha256"]:
            raise ValueError("Refusing to replace an existing different model file.")
        # Existing pinned weights may have been provisioned with a restrictive
        # umask by an older version. They are public model bytes, and the
        # dedicated nonroot container must also be able to read this bind mount.
        output.chmod(0o644)
        return output
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        digest, size = hashlib.sha256(), 0
        with tempfile.NamedTemporaryFile(dir=output.parent, prefix=".pose-model-", delete=False) as target:
            temporary = Path(target.name)
            with urllib.request.urlopen(MANIFEST["url"], timeout=60) as response:
                if response.url != MANIFEST["url"]:
                    raise ValueError("Unexpected model download redirect.")
                while chunk := response.read(1024 * 1024):
                    size += len(chunk)
                    if size > MANIFEST["bytes"]:
                        raise ValueError("Unexpected model download size.")
                    digest.update(chunk)
                    target.write(chunk)
        if size != MANIFEST["bytes"] or digest.hexdigest() != MANIFEST["sha256"]:
            raise ValueError("Model checksum verification failed.")
        # A same-directory hard link publishes all verified bytes atomically and
        # refuses to replace a concurrently created destination.
        # These are public upstream weights, not user media or credentials. The
        # non-root inference container must be able to read a host-mounted model.
        os.chmod(temporary, 0o644)
        os.link(temporary, output)
        return output
    finally:
        if temporary:
            temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, help="Destination for the pinned model; existing different files are rejected")
    arguments = parser.parse_args()
    provision(arguments.output)
    print(json.dumps({"model": MANIFEST["name"], "sha256": MANIFEST["sha256"], "status": "verified"}))
