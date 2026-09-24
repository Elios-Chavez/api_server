from __future__ import annotations

from typing import Any

from ..models import EdgeError


def capture_local_frame(device: str) -> Any:
    """Capture one frame from a local development webcam; never posts by itself."""
    try:
        import cv2  # type: ignore
    except ImportError as error:
        raise EdgeError("OpenCV no está instalado para la cámara local.") from error
    camera = cv2.VideoCapture(device)
    try:
        if not camera.isOpened():
            raise EdgeError(f"No se pudo abrir la cámara local: {device}")
        ok, frame = camera.read()
        if not ok or frame is None or getattr(frame, "size", 0) == 0:
            raise EdgeError(f"La cámara local no devolvió un frame válido: {device}")
        return frame
    finally:
        camera.release()
