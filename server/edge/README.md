# Raspberry Edge — ESP32-CAM

Proceso desacoplado para `ESP32-CAM → Raspberry Pi → POST /api/edge/observations`. La cámara sólo entrega JPEG; la Raspberry detecta marcadores ArUco y el backend sigue siendo la fuente de verdad operativa. El agente nunca escribe `digitalStock`, ventas o compras.

## Instalación

```bash
cd server/edge
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Se requiere `opencv-contrib-python` porque el detector usa ArUco. Configura `EDGE_MARKER_MAP` de forma centralizada, por ejemplo `10:producto-a,11:producto-a`.

## Fixture sin hardware

```bash
PYTHONPATH=. python -m edge.main --image fixtures/smart-zone-8.jpg --once --dry-run
```

La imagen de 8 marcadores debe producir `producto-a: 8`; la de 6, `producto-a: 6`. Una imagen sin marcadores o con IDs desconocidos se rechaza y no construye una observación con cantidad cero. Las fixtures binarias deben generarse/calibrarse en un equipo con OpenCV contrib; ver `fixtures/README.md`.

## ESP32-CAM en LAN

Configura `ESP32_CAMERA_URL=http://IP_ESP32/capture` y ejecuta:

```bash
PYTHONPATH=. python -m edge.main
```

El intervalo predeterminado es 5 segundos. Ante timeout, JPEG inválido, detección ambigua o backend inalcanzable, se registra el fallo y no se confirma ningún cambio. El POST tiene reintentos limitados con el mismo `observationId`, sin cola persistente.

## Debug

Con `EDGE_DEBUG=true` y `EDGE_DEBUG_OUTPUT=/tmp/smart-zone.jpg` se guarda una imagen anotada con IDs y productos. Esa imagen es sólo local para diagnóstico y no se envía al frontend.
