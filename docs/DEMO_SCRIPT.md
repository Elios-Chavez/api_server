# Guion de demo — 3 a 5 minutos

## Preflight — 30 segundos

- Abrir la WebApp desde la URL LAN real.
- Confirmar `Sistema disponible`.
- Usar el estado demo autorizado; no editar SQL, payloads ni DevTools durante la exposición.
- La demo oficial se realiza con touch y texto. La voz es opcional.

## ESCENA 1 — VENTA

**Duración:** 45 segundos.

**Qué hace la persona:** Desde Home entra a `Caja`, abre `Simulación de lectura QR`, selecciona Producto A y registra 1 unidad.

**Qué sucede:** El inventario digital baja de 8 a 7 y aparece una confirmación visible.

**Qué decir:** “María vende una unidad. Esta entrada representa la lectura que normalmente recibiríamos de un POS.”

**Resultado:** Venta registrada y estado actualizado por el flujo normal.

## ESCENA 2 — ANAQUEL

**Duración:** 60 segundos.

**Qué hace la persona:** Desde Home entra a `Dueña` y abre `Centro de Control`.

**Qué sucede:** Se muestra la prioridad o el estado estable correspondiente a los datos preparados. El escenario 8/6 se presenta como discrepancia simulada hasta contar con ESP32-CAM y Raspberry reales.

**Qué decir:** “El sistema compara lo registrado con lo observado y pone primero lo que requiere atención.”

**Resultado:** Producto, registrado, observado, diferencia y acción recomendada son legibles en una sola vista.

## ESCENA 3 — PRESUPUESTO

**Duración:** 45 segundos.

**Qué hace la persona:** Entra a `Copiloto`, conserva o introduce `$3,000` y pulsa `Calcular`.

**Qué sucede:** Aparecen presupuesto, total asignado, restante, productos recomendados y motivo.

**Qué decir:** “El plan respeta el límite disponible y explica por qué propone cada producto.”

**Resultado:** El cálculo se entiende sin mostrar detalles técnicos.

## ESCENA 4 — RESUMEN

**Duración:** 45 segundos.

**Qué hace la persona:** En `Copiloto` pregunta `¿Qué necesita mi atención?` y vuelve al Centro de Control si se ofrece el enlace.

**Qué sucede:** El Copiloto responde usando los hechos operativos disponibles y el Centro muestra como máximo tres recomendaciones ordinarias.

**Qué decir:** “Puede detectar muchas señales, pero sólo presenta primero lo que realmente merece atención.”

**Resultado:** Respuesta local disponible aunque DeepSeek no esté habilitado.

## ESCENA EXTRA — DEMANDA

**Duración:** 30 segundos.

Cliente pregunta `¿Tienen Monster Mango?`; si no está disponible, la dueña abre `Demanda` y muestra las solicitudes agrupadas. Se explica como oportunidad para evaluar incorporar el producto, no como una orden de compra.

## Cierre

Recordar: el MVP está validado por software y LAN local; ESP32-CAM, Raspberry, iPad y LAN sin Internet permanecen como validaciones físicas pendientes.
