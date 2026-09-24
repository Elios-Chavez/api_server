# Contratos de eventos del MVP

Todos los eventos son hechos operativos estructurados; no son event sourcing ni sustituyen PostgreSQL.

```json
{ "type": "sale.completed", "timestamp": "...", "data": { "saleId": "...", "productId": "...", "quantity": 1, "unitPrice": 45, "total": 45 } }
```

- `sale.completed`: venta registrada; actualiza inventario digital.
- `stock.physical_observed`: Edge informa zona, fuente, producto, cantidad y momento.
- `customer.product_query`: Customer Assistant conserva sesión, pregunta y estado `available`, `unavailable` o `not_found`; alimenta `product_requests`.
- `feedback.submitted`: opinión con `mood` `sad`, `neutral` o `happy`.
- `product.created`: contrato reservado para P1; alta asistida por foto sigue pendiente y no se finge implementada.
- `owner.budget_available`: presupuesto administrativo enviado a la Calculadora; el plan nunca supera el monto recibido.

Los eventos se emiten como trazas estructuradas del backend. PostgreSQL sigue siendo la fuente de verdad de los datos operativos.
