# Guion de demo — Copiloto Phygital

## Objetivo

Recorrer el MVP en una tableta usando la LAN, sin cambiar reglas de negocio ni editar datos manualmente durante la exposición. La fuente operativa esperada es PostgreSQL cuando `PERSISTENCE_MODE=postgres` esté activo.

## Preflight

1. Confirmar la IP LAN actual del servidor con `ip addr`; no reutilizar una IP fija en documentación.
2. Confirmar `HOST=0.0.0.0` y el puerto configurado del backend.
3. Desde la tableta abrir `http://<IP_LAN>:<FRONTEND_PORT>` o la URL same-origin del despliegue real.
4. Comprobar `http://<IP_LAN>:3001/api/health` desde otro dispositivo.
5. Confirmar en el health y en la configuración que la persistencia sea PostgreSQL. Si reporta `database: json`, marcar PostgreSQL como pendiente.
6. Tener un estado demo preparado por el procedimiento autorizado; no ejecutar SQL manual durante la demostración.

## Recorrido corto

### 1. Cliente — consulta

Abrir `Cliente` desde Home, preguntar por un producto disponible y mostrar la respuesta basada en el catálogo. Continuar con la pantalla de opinión y seleccionar un estado de satisfacción.

### 2. Caja — venta

Abrir `Caja` y usar el modo QR simulado desde `/admin/ventas?mode=qr`. Registrar una unidad. Verificar en pantalla la confirmación de venta y que la existencia digital se actualice mediante la mutación normal.

### 3. Dueña — Centro de Control

Abrir `Centro de Control`. Mostrar la alerta prioritaria o el estado estable que corresponda a los datos reales. Entrar a Inventario para contrastar digital, físico, diferencia y punto de reorden.

### 4. Copiloto — explicación y presupuesto

Preguntar `¿Qué necesita mi atención?`, después `¿Qué debo resurtir?`. Mostrar los hechos utilizados y la ruta sugerida. En la calculadora, introducir un presupuesto positivo y revisar asignado/restante; si no hay datos de resurtido, mostrar el estado vacío sin inventar recomendaciones.

## Validación de estados

- Carga: aparece un estado de espera sin desplazar los controles.
- Error: explica qué falló y permite reintentar.
- Éxito: se anuncia con texto visible y `aria-live`.
- Sin Internet con LAN activa: debe conservarse el acceso al backend local; DeepSeek puede fallar y el Copiloto local debe seguir siendo la alternativa documentada.
- Hardware: la validación ESP32/Raspberry/iPad sólo se marca PASS con evidencia física; webcam local y fixtures no sustituyen esa prueba.

## Evidencia mínima por ronda

Registrar sólo: ruta, acción, respuesta visible, identificador de operación si existe y estado de conectividad. Para una discrepancia física, registrar `observationId`, digital, físico, diferencia y severidad provenientes de la API. No editar payloads, SQL ni DevTools durante la ronda.

## Criterio de cierre de Fase 22

La preparación de demo y UX queda lista cuando build, lint y regresiones pasan. La aceptación física sigue pendiente hasta contar con ESP32-CAM, Raspberry e iPad reales y PostgreSQL operativo verificable.
