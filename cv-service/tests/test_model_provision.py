import hashlib
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import provision_model


class ModelProvisionTests(unittest.TestCase):
    def test_download_verifies_and_publishes_readable_weights_without_temporary_files(self):
        fixture = b"verified public weights"
        manifest = {"url": "https://fixture.invalid/pinned.task", "bytes": len(fixture), "sha256": hashlib.sha256(fixture).hexdigest()}
        response = io.BytesIO(fixture)
        response.url = manifest["url"]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "models" / "pose.task"
            with patch.object(provision_model, "MANIFEST", manifest), \
                    patch.object(provision_model.urllib.request, "urlopen", return_value=response) as download, \
                    patch.object(provision_model.os, "chmod", wraps=provision_model.os.chmod) as chmod:
                self.assertEqual(provision_model.provision(path), path.resolve())
                download.assert_called_once_with(manifest["url"], timeout=60)
                chmod.assert_called_once()
                self.assertEqual(chmod.call_args.args[1], 0o644)
            self.assertEqual(path.read_bytes(), fixture)
            self.assertEqual(list(path.parent.iterdir()), [path])

    def test_invalid_size_or_hash_never_publishes_and_removes_temporary_files(self):
        fixture = b"verified public weights"
        manifest = {"url": "https://fixture.invalid/pinned.task", "bytes": len(fixture), "sha256": hashlib.sha256(fixture).hexdigest()}
        for body in [fixture[:-1], fixture + b"extra", b"x" * len(fixture)]:
            with self.subTest(body=body), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / "pose.task"
                response = io.BytesIO(body)
                response.url = manifest["url"]
                with patch.object(provision_model, "MANIFEST", manifest), \
                        patch.object(provision_model.urllib.request, "urlopen", return_value=response):
                    with self.assertRaises(ValueError):
                        provision_model.provision(path)
                self.assertFalse(path.exists())
                self.assertEqual(list(path.parent.iterdir()), [])

    def test_redirect_never_publishes_and_removes_temporary_files(self):
        response = io.BytesIO(b"redirected bytes")
        response.url = "https://unexpected.invalid/other.task"
        manifest = {"url": "https://fixture.invalid/pinned.task", "bytes": 1, "sha256": "unused"}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "pose.task"
            with patch.object(provision_model, "MANIFEST", manifest), \
                    patch.object(provision_model.urllib.request, "urlopen", return_value=response):
                with self.assertRaisesRegex(ValueError, "redirect"):
                    provision_model.provision(path)
            self.assertEqual(list(path.parent.iterdir()), [])

    def test_failed_download_never_publishes_and_removes_temporary_files(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "pose.task"
            with patch.object(provision_model.urllib.request, "urlopen", side_effect=OSError("unavailable")):
                with self.assertRaisesRegex(OSError, "unavailable"):
                    provision_model.provision(path)
            self.assertEqual(list(path.parent.iterdir()), [])

    def test_concurrently_created_destination_is_not_replaced(self):
        fixture = b"verified public weights"
        manifest = {"url": "https://fixture.invalid/pinned.task", "bytes": len(fixture), "sha256": hashlib.sha256(fixture).hexdigest()}
        response = io.BytesIO(fixture)
        response.url = manifest["url"]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "pose.task"

            def competing_publish(source, destination):
                Path(destination).write_bytes(b"other publisher")
                raise FileExistsError("Destination already exists")

            with patch.object(provision_model, "MANIFEST", manifest), \
                    patch.object(provision_model.urllib.request, "urlopen", return_value=response), \
                    patch.object(provision_model.os, "link", side_effect=competing_publish):
                with self.assertRaises(FileExistsError):
                    provision_model.provision(path)
            self.assertEqual(path.read_bytes(), b"other publisher")
            self.assertEqual(list(path.parent.iterdir()), [path])

    def test_existing_verified_public_weights_restore_readable_mode_without_download(self):
        fixture = b"small mocked-manifest public model fixture"
        manifest = {"bytes": len(fixture), "sha256": hashlib.sha256(fixture).hexdigest()}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "pose.task"
            path.write_bytes(fixture)
            path.chmod(0o600)
            with patch.object(provision_model, "MANIFEST", manifest), \
                    patch.object(provision_model.urllib.request, "urlopen", side_effect=AssertionError("No network allowed")), \
                    patch.object(Path, "chmod", autospec=True) as chmod:
                self.assertEqual(provision_model.provision(path), path.resolve())
                chmod.assert_called_once_with(path.resolve(), 0o644)
            self.assertEqual(path.read_bytes(), fixture)

    def test_existing_different_file_is_never_changed_or_downloaded(self):
        fixture = b"different file must be preserved"
        manifest = {"bytes": len(fixture), "sha256": hashlib.sha256(b"not the same bytes").hexdigest()}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "pose.task"
            path.write_bytes(fixture)
            with patch.object(provision_model, "MANIFEST", manifest), \
                    patch.object(provision_model.urllib.request, "urlopen", side_effect=AssertionError("No network allowed")), \
                    patch.object(Path, "chmod", autospec=True) as chmod:
                with self.assertRaisesRegex(ValueError, "Refusing to replace"):
                    provision_model.provision(path)
                chmod.assert_not_called()
            self.assertEqual(path.read_bytes(), fixture)


if __name__ == "__main__":
    unittest.main()
