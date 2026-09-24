from __future__ import annotations

import urllib.error
import urllib.request
from typing import Any

from ..models import EdgeError


def capture_frame(camera_url: str, timeout: float) -> Any:
    """Fetch one JPEG snapshot from the ESP32-CAM over the local network."""
    try:
        import cv2  # type: ignore
        import numpy as np  # type: ignore
    except ImportError as error:
        raise EdgeError("OpenCV/numpy no están instalados en el entorno Edge.") from error
    try:
        request = urllib.request.Request(camera_url, headers={"User-Agent": "copiloto-edge/1.0"})
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read()
    except (OSError, urllib.error.URLError, TimeoutError) as error:
        raise EdgeError(f"ESP32-CAM no disponible: {error}") from error
    if not body:
        raise EdgeError("La ESP32-CAM devolvió un frame vacío.")
    frame = cv2.imdecode(np.frombuffer(body, dtype=np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise EdgeError("La ESP32-CAM devolvió un JPEG inválido.")
    return frame
