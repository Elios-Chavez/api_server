from __future__ import annotations

from dataclasses import dataclass
from typing import Any


class EdgeError(RuntimeError):
    """Expected capture, detection or network failure; no observation is sent."""


@dataclass(frozen=True)
class Detection:
    marker_ids: tuple[int, ...]
    product_counts: dict[str, int]
    annotated_image: Any | None = None


def build_observation(
    detection: Detection,
    *,
    observation_id: str,
    zone_id: str,
    source_id: str,
    observed_at: str,
) -> dict[str, Any]:
    if not observation_id.strip() or not zone_id.strip() or not source_id.strip():
        raise EdgeError("observationId, zoneId y sourceId son obligatorios.")
    if not detection.product_counts or any(quantity < 0 for quantity in detection.product_counts.values()):
        raise EdgeError("La detección no contiene conteos físicos válidos.")
    return {
        "observationId": observation_id,
        "zoneId": zone_id,
        "sourceId": source_id,
        "timestamp": observed_at,
        "items": [
            {"productId": product_id, "quantity": quantity}
            for product_id, quantity in sorted(detection.product_counts.items())
        ],
    }
