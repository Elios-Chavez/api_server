# Fixtures de visión

Las fixtures binarias se generan en el equipo que tenga OpenCV contrib instalado. Esto evita añadir imágenes pesadas o afirmar resultados sin haber calibrado la cámara.

La matriz mínima para esta fase es:

- `8`: markers 10–17 → `producto-a`, resultado `{ "producto-a": 8 }`.
- `6`: markers 10–15 → `producto-a`, resultado `{ "producto-a": 6 }`.
- inválida: imagen sin ArUco o con ID fuera de `EDGE_MARKER_MAP`, sin observation.
