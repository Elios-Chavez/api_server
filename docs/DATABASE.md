# Persistencia de datos

La persistencia productiva del MVP es PostgreSQL; JSON sólo permanece como fallback técnico para desarrollo.

## Configuración

Copia `server/.env.example` a `server/.env` y configura `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y `PERSISTENCE_MODE=postgres`. Las credenciales son sólo del backend; no usan variables `VITE_*`.

## Migraciones y demo

Con PostgreSQL disponible y `PERSISTENCE_MODE=postgres`:

```bash
npm run db:migrate
npm run db:seed
npm run db:import-json
npm run db:reset-demo
```

`db:reset-demo` es manual y reemplaza los datos demo, incluyendo sesiones, mensajes y solicitudes temporales del Customer Assistant. Nunca se ejecuta al arrancar Express. `db:import-json` conserva el JSON y copia su estado al esquema PostgreSQL.

## Modelo

El esquema normaliza categorías, productos, inventario, ventas con `sale_items`, compras con `purchase_items`, promociones, feedback y observaciones Edge. Ventas, compras y Edge usan transacciones y consultas parametrizadas. `GET /api/health` informa `database=connected` sólo cuando `PERSISTENCE_MODE=postgres` puede conectar.

El esquema incluye `customer_chat_sessions`, `customer_chat_messages` y `product_requests` para Customer Assistant. No se guardan nombres, contacto, audio ni biometría. La normalización de solicitudes sólo recorta, pasa a minúsculas y colapsa espacios; el análisis de productos no encontrados se realiza con SQL agrupando `normalized_query`.

La capa no es un POS completo: las ventas son entradas transaccionales simuladas o integrables con un POS existente.

## Usuarios PostgreSQL

Las migraciones se ejecutan con el owner o usuario migrador autorizado. El backend de operación usa `copiloto_edge`, sin privilegios de superusuario, creación de bases, creación de roles ni `CREATE` en `public`. Las credenciales de migración no se exponen al frontend ni se almacenan en `VITE_*`.

Ejemplo conceptual, con las variables reales sólo en el entorno del comando:

```bash
DB_HOST=... DB_PORT=... DB_NAME=copiloto_phygital DB_USER=... DB_PASSWORD=... PERSISTENCE_MODE=postgres npm run db:migrate
```

Después, Express debe arrancar con las credenciales runtime. Si se agregan tablas o secuencias nuevas, el owner/migrador debe revisar y conceder explícitamente los permisos mínimos requeridos a `copiloto_edge`; no se usa `GRANT ALL` ni se otorgan privilegios globales por defecto.


### Demo reproducible

`npm run db:reset-demo` deja Producto A en 8/8/reorder 5, conserva el seed operativo y limpia Customer Assistant temporal. Debe ejecutarse manualmente con un usuario migrador autorizado; después Express se inicia con `copiloto_edge`.
