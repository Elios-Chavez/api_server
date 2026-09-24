# Smart Zone Edge

## Arquitectura

La ESP32-CAM expone un snapshot JPEG (`/capture`) dentro de la LAN. El proceso Python de `server/edge` corre en Raspberry Pi o PC, detecta marcadores ArUco y transforma el resultado a `PhysicalObservation`. Sólo entonces envía `POST /api/edge/observations`; el backend valida, aplica idempotencia y persiste el `physical_stock`. El proceso Edge no usa DeepSeek y no modifica inventario digital.

## Configuración

Copia `server/edge/.env.example` a un entorno local. Las variables principales son `ESP32_CAMERA_URL`, `BACKEND_BASE_URL`, `EDGE_SOURCE_ID`, `EDGE_ZONE_ID`, `EDGE_MARKER_MAP`, `CAPTURE_INTERVAL_SECONDS`, `REQUEST_TIMEOUT_SECONDS` y `EDGE_DEBUG`. No se incluyen IPs reales, Wi-Fi ni contraseñas en el repositorio.

## Ejecución

```bash
cd server/edge
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. python -m edge.main --once --image fixtures/smart-zone-6.jpg --dry-run
```

Para hardware, configura `ESP32_CAMERA_URL=http://IP_ESP32/capture`, `BACKEND_BASE_URL=http://IP_BACKEND:3001/api` y ejecuta `PYTHONPATH=. python -m edge.main`. El flujo no necesita Internet: ESP32, Raspberry, backend y PostgreSQL pueden estar en la misma LAN.

## Seguridad operacional

Los IDs ArUco se mapean explícitamente a productos. Un frame vacío, JPEG corrupto, marker desconocido, ID duplicado o ausencia de markers no se convierte en `quantity=0`. El mismo payload conserva su `observationId` durante retries limitados. No hay cola persistente ni replay de capturas antiguas.

## Escenario HackaTec

Con markers 10–17 mapeados a `producto-a`, ocho objetos producen `{producto-a: 8}`. Tras retirar dos, seis producen `{producto-a: 6}`. El backend conserva digital 8, actualiza físico 6 y las reglas existentes muestran diferencia -2 en Inventario/Centro de Control; el Copiloto puede explicarlo con LocalCopilotProvider o DeepSeek en backend.

Las pruebas físicas de ESP32-CAM y Raspberry requieren hardware y red LAN disponibles; si no están disponibles deben reportarse como `NO VERIFICADO`.
