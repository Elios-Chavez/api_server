from __future__ import annotations

import argparse
import os
import sys
import time
import uuid
from dataclasses import replace
from datetime import datetime, timezone
from pathlib import Path

from .api.backend_client import fetch_marker_map, send_observation
from .capture.esp32_camera import capture_frame
from .capture.local_camera import capture_local_frame
from .config import Config, from_env
from .models import EdgeError, build_observation
from .vision.detector import detect_markers


def capture_source(config: Config, image_path: str | None):
    if image_path:
        try:
            import cv2  # type: ignore
        except ImportError as error:
            raise EdgeError("OpenCV no está instalado para leer el fixture.") from error
        frame = cv2.imread(image_path)
        if frame is None:
            raise EdgeError(f"Fixture inválido o inexistente: {image_path}")
        return frame
    if config.capture_mode == "camera":
        return capture_local_frame(config.local_camera_device)
    if config.capture_mode != "esp32":
        raise EdgeError("EDGE_CAPTURE_MODE debe ser esp32 o camera; usa --image para fixtures.")
    if not config.camera_url:
        raise EdgeError("Configura ESP32_CAMERA_URL o usa --image.")
    return capture_frame(config.camera_url, config.request_timeout_seconds)


def process_once(config: Config, image_path: str | None, dry_run: bool = False) -> dict:
    frame = capture_source(config, image_path)
    detection = detect_markers(frame, config.marker_map, config.aruco_dictionary)
    if config.debug and config.debug_output and detection.annotated_image is not None:
        import cv2  # type: ignore
        cv2.imwrite(config.debug_output, detection.annotated_image)
    payload = build_observation(
        detection,
        observation_id=f"edge-{uuid.uuid4()}",
        zone_id=config.zone_id,
        source_id=config.source_id,
        observed_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    )
    if dry_run:
        return payload
    return send_observation(config.backend_url, payload, config.request_timeout_seconds, config.max_post_attempts)


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description="Smart Zone Edge: ESP32-CAM -> ArUco -> backend.")
    result.add_argument("--image", help="Fixture local para probar sin ESP32-CAM.")
    result.add_argument("--once", action="store_true", help="Procesa una captura y termina.")
    result.add_argument("--dry-run", action="store_true", help="Construye el payload sin enviarlo.")
    return result


def main() -> int:
    args = parser().parse_args()
    config = from_env()
    try:
        if not args.image and not args.dry_run:
            config = replace(config, marker_map=fetch_marker_map(config.backend_url, config.request_timeout_seconds))
        while True:
            payload = process_once(config, args.image, args.dry_run)
            print(payload, flush=True)
            if args.once or args.image or args.dry_run:
                return 0
            time.sleep(max(0.1, config.capture_interval_seconds))
    except (EdgeError, OSError, ValueError) as error:
        print(f"Edge detenido sin reportar observación: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
