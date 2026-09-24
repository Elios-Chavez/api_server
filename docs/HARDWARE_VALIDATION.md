# Preparación de validación física

## Arquitectura LAN

```text
ESP32-CAM (JPEG) -> Raspberry Pi Edge (OpenCV/ArUco)
                         |
                         v
                 Backend API -> PostgreSQL
                         ^
                         |
                    iPad/WebApp
```

La Raspberry sólo llama al backend. No recibe credenciales de PostgreSQL. La IP del servidor se configura en `BACKEND_BASE_URL`; no se fija en código.

## Edge

```bash
cd server/edge
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m edge.diagnose
```

`EDGE_CAPTURE_MODE=esp32` es el modo predeterminado. Para pruebas locales de percepción, usar explícitamente `EDGE_CAPTURE_MODE=camera` y `EDGE_LOCAL_CAMERA_DEVICE=/dev/video0` o `/dev/video1`. La webcam local no equivale al ESP32 y no debe marcar la validación física como PASS.

Fixtures sin hardware:

```bash
PYTHONPATH=. python -m edge.main --image fixtures/smart-zone-8.jpg --once --dry-run
PYTHONPATH=. python -m edge.main --image fixtures/smart-zone-6.jpg --once --dry-run
PYTHONPATH=. python -m edge.main --image fixtures/smart-zone-invalid.jpg --once --dry-run
```

## ESP32-CAM

Cuando exista hardware, confirmar mediante HTTP el firmware y el endpoint real antes de configurar `ESP32_CAMERA_URL`. Probar el snapshot con el endpoint documentado por ese firmware; no asumir una IP ni una ruta.

## Raspberry Pi Zero 2 W

- Raspberry Pi OS, Wi-Fi en la LAN y Python disponibles.
- Crear `server/edge/.venv` e instalar `requirements.txt`.
- Copiar `.env.example` a `.env` sin distribuir secretos.
- Configurar `ESP32_CAMERA_URL`, `BACKEND_BASE_URL`, `EDGE_SOURCE_ID` y `EDGE_ZONE_ID`.
- Ejecutar `python -m edge.diagnose` antes de `PYTHONPATH=. python -m edge.main`.

## iPad/tablet

Abrir la URL LAN real del frontend/backend y comprobar Home, Cliente, Caja, Dueña, Centro de Control, Copilot, Feedback y Presupuesto. La URL debe venir del despliegue real; no usar la IP actual como valor permanente.

## Secuencia 8 -> 6

1. Reset demo y confirmar digital 8 / físico 8.
2. Retirar dos unidades físicas sin vender.
3. Ejecutar una observación real desde Raspberry.
4. Confirmar físico 6 en PostgreSQL, alerta PRIORITY en Dashboard y explicación -2 en Copilot.
5. Resolver físicamente a 6/6 y confirmar estado estable.
6. Repetir tres veces sin SQL manual, DevTools, payload editado ni cambios de código.

## Sin Internet y caída de cámara

Mantener la LAN y bloquear sólo salida a Internet. ESP32, Raspberry, backend, PostgreSQL e iPad deben seguir comunicándose. Si la cámara cae, no se debe producir una observación válida ni convertir el físico en cero.

## Checklist actual

- ESP32-CAM identificada: NO VERIFICADO
- Snapshot ESP32 confirmado: NO VERIFICADO
- Raspberry identificada: NO VERIFICADO
- Raspberry -> ESP32: NO VERIFICADO
- Raspberry -> Backend: NO VERIFICADO
- OpenCV/ArUco en Raspberry: NO VERIFICADO
- iPad -> WebApp: NO VERIFICADO
- 8 físicos detectados: NO VERIFICADO
- 6 físicos detectados: NO VERIFICADO
- 8 -> 6 -> PRIORITY: NO VERIFICADO
- LAN sin Internet: NO VERIFICADO
- Demo física x3: NO VERIFICADO

Micrófono/TTS y alta por foto quedan fuera de esta iteración.
