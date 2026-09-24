# Arquitectura narrativa del MVP v4

Copiloto Phygital es una capa de inteligencia operativa: percibe, registra, calcula, prioriza y comunica.

- **Vigilante**: Edge / Raspberry informa observaciones físicas estructuradas; no decide reglas de negocio.
- **Calculadora**: AlertEngine, reglas de discrepancia, reorder, demanda y planificador de presupuesto determinista.
- **Conocedora**: PostgreSQL contiene catálogo, inventario, ventas, compras, feedback, sesiones y solicitudes; construye el contexto vigente.
- **Mensajera**: DeepSeek explica hechos ya calculados. El fallback local mantiene la operación cuando el proveedor no está disponible.

La secuencia oficial es `datos → algoritmos → hechos → IA → explicación`. La Home organiza la demo por **Cliente**, **Caja** y **Dueña**. Promociones y despensa siguen disponibles por código/ruta, pero no ocupan la narrativa principal del modo HackaTec.

P0 se demuestra con catálogo, venta simulada, evento `sale.completed`, observación Edge, discrepancia, AlertEngine, fallback y Centro de Control. Presupuesto, demanda y encuesta de tres estados permanecen como P1 demostrable cuando el P0 está estable. Alta por foto queda P1 pendiente.
