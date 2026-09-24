"""Generate small ArUco fixtures for local detector validation."""

from pathlib import Path

import cv2
import numpy as np


ROOT = Path(__file__).parent
DICTIONARY = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)


def make_fixture(name: str, marker_ids: list[int]) -> None:
    canvas = np.full((620, 1120, 3), 255, dtype=np.uint8)
    size = 180
    for index, marker_id in enumerate(marker_ids):
        marker = cv2.aruco.generateImageMarker(DICTIONARY, marker_id, size)
        x = 40 + (index % 4) * 270
        y = 40 + (index // 4) * 270
        canvas[y : y + size, x : x + size] = cv2.cvtColor(marker, cv2.COLOR_GRAY2BGR)
    if not cv2.imwrite(str(ROOT / name), canvas):
        raise RuntimeError(f"No se pudo escribir {name}")


make_fixture("smart-zone-8.jpg", list(range(10, 18)))
make_fixture("smart-zone-6.jpg", list(range(10, 16)))
make_fixture("smart-zone-invalid.jpg", [49])
