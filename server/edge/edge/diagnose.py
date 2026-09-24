from __future__ import annotations

import sys
import urllib.error
import urllib.request

from .config import from_env


def check(label: str, ok: bool, detail: str) -> None:
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {label}: {detail}")


def main() -> int:
    config = from_env()
    check("Python", sys.version_info >= (3, 10), sys.version.split()[0])
    try:
        import cv2  # type: ignore
        check("OpenCV", True, cv2.__version__)
        check("ArUco", hasattr(cv2, "aruco"), "cv2.aruco disponible" if hasattr(cv2, "aruco") else "cv2.aruco ausente")
    except ImportError as error:
        check("OpenCV", False, str(error))
        check("ArUco", False, "no verificable sin OpenCV")
    mode_ok = config.capture_mode in {"esp32", "camera"}
    check("fuente", mode_ok, f"EDGE_CAPTURE_MODE={config.capture_mode}")
    if config.capture_mode == "esp32":
        check("cámara configurada", bool(config.camera_url), config.camera_url or "ESP32_CAMERA_URL ausente")
    else:
        check("cámara configurada", bool(config.local_camera_device), config.local_camera_device)
    health_url = config.backend_url.removesuffix("/edge/observations") + "/health"
    try:
        with urllib.request.urlopen(health_url, timeout=config.request_timeout_seconds) as response:
            check("backend /api/health", 200 <= response.status < 300, f"HTTP {response.status}")
    except (OSError, urllib.error.URLError, TimeoutError) as error:
        check("backend /api/health", False, str(error))
    check("zone/source", bool(config.zone_id.strip() and config.source_id.strip()), f"{config.zone_id}/{config.source_id}")
    print("Diagnóstico no modifica inventario ni envía observaciones.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
