# Resumen técnico — Copiloto Phygital

## 1. Problema

Un pequeño comercio necesita saber qué requiere atención sin revisar manualmente cada dato de inventario, ventas, solicitudes y feedback.

## 2. Solución

La WebApp reúne tres recorridos: Cliente, Caja y Dueña. El backend normaliza operaciones, PostgreSQL conserva los datos operativos y el Centro de Control prioriza señales mediante reglas explícitas.

## 3. Arquitectura real

```text
OPERACIÓN / ESPACIO
        ↓
EVENTOS operativos
        ↓
VIGILANTE — AlertEngine
        ↓
CALCULADORA — reglas de inventario, demanda y presupuesto
        ↔
CONOCEDORA — PostgreSQL y repositorios
        ↓
HECHOS
        ↓
MENSAJERA — Copiloto local o DeepSeek opcional
        ↓
INTERFAZ — WebApp tablet-first
```

## 4. Frontend

React, TypeScript, Vite, React Router, TanStack Query y Lucide. La interfaz usa providers local/API, invalidación de consultas tras mutaciones y estados de carga/error/éxito. La PWA precachea el shell; las respuestas de API no se cachean como éxito offline.

## 5. Backend y PostgreSQL

Express expone health, operaciones, Customer Assistant, Copiloto, demanda y observaciones Edge. PostgreSQL es la fuente principal productiva; el modo JSON queda como fallback. Las credenciales de PostgreSQL no se distribuyen al Edge. El usuario runtime aplica privilegio mínimo y la clave de IA permanece sólo en backend.

## 6. Alertas y reglas

La diferencia entre inventario digital y físico tiene prioridad. El punto de reorden produce atención; baja rotación y demanda no satisfecha producen oportunidades según las reglas existentes. Los cálculos no dependen de un LLM.

## 7. Edge

La preparación software existente es `ESP32-CAM → Raspberry Edge → OpenCV/ArUco → POST /api/edge/observations`. Las fixtures 8/6 y la webcam local validan percepción software. ESP32-CAM y Raspberry reales permanecen NO VERIFICADAS; no se presenta la webcam como sustituto.

## 8. IA

DeepSeek es una mensajera opcional para redactar respuestas. El proveedor local conserva la explicación operativa cuando DeepSeek está apagado o falla. La fuente de hechos sigue siendo la operación y PostgreSQL.

## 9. LAN y resiliencia

El backend está preparado para escuchar en `0.0.0.0:3001` y el acceso LAN local está validado. La operación LAN sin salida a Internet todavía es NO VERIFICADA. Si la cámara deja de responder, Edge no debe convertir el físico en cero ni crear una observación inválida.

## 10. Seguridad y privacidad

API keys sólo en backend, runtime PostgreSQL con mínimo privilegio, Admin separado del recorrido Cliente y sin almacenamiento de audio.

## 11. Pruebas y límites

Build, lint, compilación backend, AlertEngine/demanda y pruebas Edge pasan. La validación física de ESP32/Raspberry/iPad, voz/TTS y LAN sin Internet siguen pendientes. La visión usa marcadores ArUco y el MVP no es un POS completo.

## 12. Evolución futura

Tablet Android económica, integración POS/ERP, más zonas, otros canales, OCR, NFC, WhatsApp y más sensores son posibilidades futuras, no funciones actuales.
