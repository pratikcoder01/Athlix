import hashlib
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import provision_model


class ModelProvisionTests(unittest.TestCase):
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
