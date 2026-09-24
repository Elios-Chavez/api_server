from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from typing import Any

from ..models import EdgeError


def fetch_marker_map(observation_url: str, timeout: float) -> dict[int, str]:
    config_url = observation_url.removesuffix("/observations") + "/config"
    request = urllib.request.Request(config_url, method="GET", headers={"Accept": "application/json", "User-Agent": "copiloto-edge/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = json.loads(response.read().decode("utf-8"))
            return {int(marker): str(product) for marker, product in body.get("markers", {}).items()}
    except (OSError, urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError) as error:
        raise EdgeError(f"No fue posible obtener el mapping ArUco productivo: {error}") from error


def send_observation(url: str, payload: dict[str, Any], timeout: float, attempts: int) -> Any:
    """Send the same event ID on bounded retries; never queues stale events."""
    body = json.dumps(payload).encode("utf-8")
    last_error: Exception | None = None
    for attempt in range(attempts):
        request = urllib.request.Request(url, data=body, method="POST", headers={"Content-Type": "application/json", "User-Agent": "copiloto-edge/1.0"})
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                raw = response.read().decode("utf-8")
                if not 200 <= response.status < 300:
                    raise EdgeError(f"Backend rechazó la observación: HTTP {response.status}")
                return json.loads(raw) if raw else None
        except (OSError, urllib.error.URLError, TimeoutError, json.JSONDecodeError, EdgeError) as error:
            last_error = error
            if attempt + 1 < attempts:
                time.sleep(0.25)
    raise EdgeError(f"Backend unreachable: {last_error}")
