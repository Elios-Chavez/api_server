# PWA y resiliencia

La PWA se genera con `vite-plugin-pwa`. En producción precachea el app shell, bundles, estilos, iconos y manifest; no cachea `/api/*`, ventas, compras, analytics, sesiones ni respuestas sensibles del Copiloto. Las actualizaciones muestran `Nueva versión disponible` y requieren pulsar `Actualizar`.

## LAN

Ejecuta el frontend y Express en el equipo de la tienda y configura `VITE_API_BASE_URL` con la URL LAN del backend, sin hardcodear IPs. Para producción/demo, sirve el build por HTTPS cuando el dispositivo real lo requiera; `localhost` es suficiente para desarrollo.

## Estados

La interfaz combina `navigator.onLine` con `GET /api/health`: `online`, `internet-degraded` (LAN disponible sin Internet), `backend-offline` y `offline`. Las mutaciones tienen `retry: 0`; si el backend no responde, no se muestra éxito ni se crea una cola offline. El usuario puede reintentar.

DeepSeek continúa siendo opcional: el backend usa sus fallbacks locales cuando Internet falla. Customer Assistant conserva su respuesta determinista. La voz mantiene entrada y salida textual si Web Speech no está disponible. PostgreSQL sigue siendo la fuente de verdad.
