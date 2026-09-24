import unittest

try:
    import cv2  # type: ignore
except ImportError:
    cv2 = None


@unittest.skipIf(cv2 is None, "OpenCV no instalado en este entorno")
class DetectorFixtureTests(unittest.TestCase):
    def test_requires_generated_fixtures(self):
        self.assertTrue(cv2.aruco is not None)
