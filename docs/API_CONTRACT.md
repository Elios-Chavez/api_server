# Contrato API preparado

La aplicación soporta VITE_DATA_MODE=local (modo demo predeterminado) y VITE_DATA_MODE=api. El backend Express local expone estos contratos bajo `/api` y el frontend usa `VITE_API_BASE_URL` como base.

| Método | Endpoint | Request | Response esperada |
| --- | --- | --- | --- |
| GET | /products | — | Product[] |
| GET | /health | — | `{ status: "ok" }` |
| GET | /inventory | — | InventoryRecord[] |
| PATCH | /inventory/:id | cambios parciales de inventario | InventoryRecord[] |
| GET/POST | /sales | SaleInput en POST | SaleRecord[] / SaleRecord |
| GET/POST | /purchases | PurchaseInput en POST | PurchaseRecord[] / PurchaseRecord |
| GET/POST/PATCH | /promotions, /promotions/:id | promoción o cambios parciales | Promotion[] / Promotion |
| GET/POST | /feedback | feedback sin id en POST | Feedback[] / Feedback |
| GET | /alerts | — | InventoryAlert[] |
| GET | /summary | — | Record<string, number> |
| POST | /edge/observations | observación física normalizada | inventario y alertas actualizados |
| POST | /copilot/ask | pregunta e historial breve | CopilotResponse |

Las respuestas deben usar los modelos normalizados de src/types/domain.ts. Errores HTTP, JSON inválido, conexión y timeout se convierten en ApiRequestError.

### Observación Edge

```http
POST /api/edge/observations
Content-Type: application/json
```

```json
{
  "observationId": "obs-demo-001",
  "zoneId": "zona-a",
  "sourceId": "edge-01",
  "timestamp": "2026-09-23T12:00:00.000Z",
  "items": [{ "productId": "producto-a", "quantity": 6 }]
}
```

`sourceId` representa una fuente física abstracta; no está acoplado a ESP32-CAM. Las observaciones con el mismo `observationId` son idempotentes. POS y ERP quedan como integraciones futuras hacia la misma normalización; Copiloto no reemplaza esos sistemas.

### Copiloto

`POST /api/copilot/ask` recibe únicamente `question` e historial breve. El backend reconstruye el `BusinessContext` desde sus datos actuales; el frontend no puede enviar el contexto oficial. Con `COPILOT_MODE=deepseek` y `DEEPSEEK_ENABLED=true`, intenta DeepSeek y valida el JSON estructurado. Ante cualquier fallo usa el provider local determinista.
