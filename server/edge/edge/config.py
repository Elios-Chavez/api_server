from __future__ import annotations

import os
from dataclasses import dataclass


def _mapping(value: str) -> dict[int, str]:
    result: dict[int, str] = {}
    for pair in value.split(","):
        if not pair.strip():
            continue
        marker, separator, product = pair.partition(":")
        if not separator or not marker.strip().isdigit() or not product.strip():
            raise ValueError("EDGE_MARKER_MAP debe usar markerId:productId separado por comas.")
        result[int(marker.strip())] = product.strip()
    return result


@dataclass(frozen=True)
class Config:
    capture_mode: str
    camera_url: str | None
    local_camera_device: str
    backend_url: str
    source_id: str
    zone_id: str
    marker_map: dict[int, str]
    capture_interval_seconds: float
    request_timeout_seconds: float
    max_post_attempts: int
    aruco_dictionary: str
    debug: bool
    debug_output: str | None


def from_env() -> Config:
    return Config(
        capture_mode=os.getenv("EDGE_CAPTURE_MODE", "esp32").lower(),
        camera_url=os.getenv("ESP32_CAMERA_URL"),
        local_camera_device=os.getenv("EDGE_LOCAL_CAMERA_DEVICE", "/dev/video0"),
        backend_url=os.getenv("BACKEND_BASE_URL", "http://127.0.0.1:3001/api").rstrip("/") + "/edge/observations",
        source_id=os.getenv("EDGE_SOURCE_ID", "edge-01"),
        zone_id=os.getenv("EDGE_ZONE_ID", "zona-a"),
        marker_map=_mapping(os.getenv("EDGE_MARKER_MAP", "10:producto-a,11:producto-a,12:producto-a,13:producto-a,14:producto-a,15:producto-a,16:producto-a,17:producto-a")),
        capture_interval_seconds=float(os.getenv("CAPTURE_INTERVAL_SECONDS", "5")),
        request_timeout_seconds=float(os.getenv("REQUEST_TIMEOUT_SECONDS", "5")),
        max_post_attempts=max(1, int(os.getenv("EDGE_MAX_POST_ATTEMPTS", "2"))),
        aruco_dictionary=os.getenv("EDGE_ARUCO_DICTIONARY", "DICT_4X4_50"),
        debug=os.getenv("EDGE_DEBUG", "false").lower() == "true",
        debug_output=os.getenv("EDGE_DEBUG_OUTPUT"),
    )
