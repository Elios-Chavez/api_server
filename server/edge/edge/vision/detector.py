from __future__ import annotations

from typing import Any

from ..models import Detection, EdgeError


def _aruco_dictionary(cv2: Any, name: str) -> Any:
    dictionary_id = getattr(cv2.aruco, name, None)
    if dictionary_id is None:
        raise EdgeError(f"Diccionario ArUco no disponible: {name}")
    return cv2.aruco.getPredefinedDictionary(dictionary_id)


def detect_markers(frame: Any, marker_map: dict[int, str], dictionary_name: str) -> Detection:
    """Detect unique ArUco markers and aggregate them into product quantities."""
    if frame is None or getattr(frame, "size", 0) == 0:
        raise EdgeError("El frame está vacío.")
    try:
        import cv2  # type: ignore
    except ImportError as error:
        raise EdgeError("OpenCV no está instalado. Instala edge/requirements.txt.") from error
    if not hasattr(cv2, "aruco"):
        raise EdgeError("OpenCV ArUco no está disponible; instala opencv-contrib-python.")
    dictionary = _aruco_dictionary(cv2, dictionary_name)
    parameters = cv2.aruco.DetectorParameters()
    detector = cv2.aruco.ArucoDetector(dictionary, parameters)
    corners, ids, _ = detector.detectMarkers(frame)
    if ids is None or len(ids) == 0:
        raise EdgeError("No se detectaron marcadores ArUco; no se reporta quantity=0.")
    marker_ids = tuple(int(value[0]) for value in ids)
    if len(set(marker_ids)) != len(marker_ids):
        raise EdgeError("Se detectó un marker ID duplicado; la observación es ambigua.")
    unknown = sorted(set(marker_ids) - marker_map.keys())
    if unknown:
        raise EdgeError(f"Marker IDs sin mapping: {unknown}")
    product_counts: dict[str, int] = {}
    for marker_id in marker_ids:
        product_id = marker_map[marker_id]
        product_counts[product_id] = product_counts.get(product_id, 0) + 1
    annotated = cv2.aruco.drawDetectedMarkers(frame.copy(), corners, ids)
    for corner, marker_id in zip(corners, marker_ids):
        point = corner[0][0].astype(int)
        cv2.putText(annotated, f"{marker_id}->{marker_map[marker_id]}", tuple(point), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 180, 0), 2)
    return Detection(marker_ids=marker_ids, product_counts=product_counts, annotated_image=annotated)
