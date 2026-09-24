# Copiloto Phygital

MVP tablet-first de Copiloto Phygital para HACKATEC 2026. La lógica operativa, los contratos y los estados de interfaz están implementados; la validación física ESP32/Raspberry/iPad permanece pendiente de hardware real.

## Stack
React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query y Lucide React.

## Uso
```bash
npm install
cp .env.example .env
npm run dev
npm run build
npm run lint
```

## Variables
`VITE_DATA_MODE=local` usa el provider local; `VITE_DATA_MODE=api` activa el adapter HTTP. Para desarrollo local, `VITE_API_BASE_URL=http://127.0.0.1:3001/api`. En una tablet, usa la IP LAN del equipo servidor, por ejemplo `http://192.168.x.x:3001/api`; no hardcodees esa IP en el código. El backend usa `server/.env.example` como referencia.

## Backend y Edge

```bash
npm run server:dev
npm run simulate:edge -- priority
npm run simulate:edge -- stable
```

El backend expone `GET /api/health` y las rutas del contrato en `docs/API_CONTRACT.md`, además de `POST /api/edge/observations`. El modo JSON es fallback; para operación productiva la fuente de verdad es PostgreSQL. El simulador reproduce conteos físicos de 8 y 6 unidades para Producto A y no sustituye la prueba física.

La persistencia PostgreSQL, la separación migración/runtime y el modelo Customer Assistant están descritos en `docs/DATABASE.md`. La narrativa MVP v4 está en `docs/ARCHITECTURE.md` y los eventos en `docs/EVENT_CONTRACTS.md`. El modo JSON continúa siendo el fallback cuando `PERSISTENCE_MODE=json`.

La PWA y sus estados de resiliencia están documentados en `docs/PWA_RESILIENCE.md`. Para una tablet real, configura `VITE_API_BASE_URL` con la dirección LAN del servidor y usa HTTPS cuando el navegador lo requiera.

Para habilitar DeepSeek sólo en el backend, configura `COPILOT_MODE=deepseek`, `DEEPSEEK_ENABLED=true`, `DEEPSEEK_MODEL=deepseek-flash` y `DEEPSEEK_API_KEY` en el entorno del servidor. Nunca uses una variable `VITE_` para esa clave. Si DeepSeek no está configurado o falla, `/api/copilot/ask` responde mediante el provider local.

Para enviar por WhatsApp las discrepancias priority, configura en server/.env TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM y TWILIO_WHATSAPP_TO. Twilio se notifica sólo después de stock.physical_observed y del cálculo físico-digital; una observación sin discrepancia no envía mensaje.

## Rutas
Públicas: `/`, `/despensa`, `/ayuda`, `/opiniones`, `/asistente`. Admin: `/admin`, `/admin/dashboard`, `/admin/alertas`, `/admin/inventario`, `/admin/ventas`, `/admin/compras`, `/admin/promociones`, `/admin/opiniones`, `/admin/copiloto`.

La voz/TTS y la validación física de sensores quedan como pendientes documentados. El recorrido de exposición está en `docs/DEMO_RUNBOOK.md`.
## PWA y operación offline

La aplicación incluye `manifest.webmanifest` y un service worker de shell. La interfaz y sus rutas pueden recargarse sin red si ya fueron visitadas, pero las respuestas de `/api` ` no se cachean. Las escrituras remotas nunca se consideran exitosas sin respuesta del backend.

El indicador de conectividad informa cuando el navegador está offline. Para operación en LAN, configura `VITE_API_BASE_URL` ` con la IP del equipo que ejecuta Express y mantén `PERSISTENCE_MODE=postgres` en `server/.env` cuando PostgreSQL sea la fuente de verdad. DeepSeek es opcional: si falla, el backend usa el Copiloto local.
