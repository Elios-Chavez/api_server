# Estado del proyecto — Copiloto Phygital

Fecha de corte: 2026-09-23.

## P0 — operación principal

| Área | Estado | Evidencia |
|---|---|---|
| WebApp tablet-first | IMPLEMENTADO / VALIDADO SOFTWARE | Build, lint y rutas públicas/admin |
| Inventario | VALIDADO | Flujo de lectura y actualización por API/provider |
| Venta | VALIDADO | Venta 8→7 y `sale.completed` en pruebas de software |
| Eventos operativos | VALIDADO | Contratos y emisión en backend |
| AlertEngine | VALIDADO | 8/6 → PRIORITY; 6/6 → STABLE |
| Centro de Control | VALIDADO SOFTWARE | Prioridades separadas de recomendaciones; máximo 3 ordinarias |
| Copiloto local | VALIDADO | Fallback sin DeepSeek probado por reglas y contexto |
| Edge software | VALIDADO | Fixtures 8/6/inválida, OpenCV 4.14 y ArUco |
| ESP32-CAM real | NO VERIFICADO | Hardware físico pendiente |
| Raspberry Pi real | NO VERIFICADO | Hardware físico pendiente |
| iPad real | NO VERIFICADO | Prueba visual/touch pendiente |
| LAN local | VALIDADO | Backend preparado en `0.0.0.0:3001`; acceso LAN confirmado |
| LAN sin Internet | NO VERIFICADO | Falta prueba aislando sólo salida externa |

## P1 — capacidades de apoyo

| Área | Estado |
|---|---|
| Customer Assistant | VALIDADO SOFTWARE | Texto y fallback local; voz física no bloquea la demo |
| Demanda no satisfecha | VALIDADO SOFTWARE | Solicitudes agrupadas y oportunidad |
| Feedback Triste / Neutral / Feliz | VALIDADO SOFTWARE | Selección corta y persistencia |
| Presupuesto de $3,000 | VALIDADO SOFTWARE | Asignado, restante, productos y motivos |
| Resumen operativo | VALIDADO SOFTWARE | Prioridad, atención, oportunidad y estable |
| Alta por foto | NO IMPLEMENTADO | Fuera del alcance actual |
| Micrófono/TTS | NO VERIFICADO | Extra, no necesario para la demo oficial |

## P2 — pospuesto

WhatsApp, NFC, OCR, predicción avanzada, más sensores e integración POS/ERP completa. No se presentan como funciones existentes.

## Límites conocidos

- La visión del prototipo usa marcadores ArUco; la ESP32-CAM y Raspberry reales aún no tienen evidencia de aceptación física.
- La aplicación registra una venta de demo, pero no es un POS completo.
- PostgreSQL es la fuente principal de datos operativos cuando `PERSISTENCE_MODE=postgres`; el modo JSON queda como fallback documentado.
- Los cálculos operativos no dependen de un LLM. DeepSeek es opcional y el Copiloto local es la alternativa.
- No se almacena audio. Las claves de IA permanecen sólo en backend.
