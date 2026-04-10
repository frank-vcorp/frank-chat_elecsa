# HANDOFF ARCH-20260409-15

## Tarea

Implementación autónoma de Reportes v2 según:

- [context/SPECs/SPEC-ARCH-20260409-15-reportes-v2.md](context/SPECs/SPEC-ARCH-20260409-15-reportes-v2.md)

## Regla de Alcance

Trabajo enfocado en reconstrucción del módulo de reportes. No tocar lógica de cierre, reapertura, seguridad, autenticación ni reglas operativas del chat fuera de la lectura del módulo.

## Reparto

### SOFIA - Builder

- Responsable principal de implementación.
- Entrega por fases:
  1. lectura histórica server-side + tipos necesarios
  2. UI Reportes v2 con filtros y paginación
  3. KPIs básicos + exportación coherente + checkpoint
- Debe usar `qodo self-review` si está disponible antes de cerrar entrega.
- Debe dejar nota explícita si Firestore requiere índices compuestos.

### Deby

- Interconsulta solo si aparece una de estas condiciones:
  - dos intentos fallidos con la misma query o el mismo bug de paginación
  - inconsistencia entre tabla, CSV y KPIs
  - ambigüedad técnica por reaperturas o doble resumen que bloquee la entrega

### Gemini

- Auditoría final de calidad y criterios de aceptación.
- Revisa:
  - consistencia entre filtros, tabla, KPIs y CSV
  - performance razonable de lectura
  - usabilidad en móvil y escritorio
  - documentación de índices o riesgos remanentes

## Guardrails

- No usar `lastMessageAt` como fecha de cierre.
- No conservar la muestra fija de 50 como base del módulo.
- No exportar el arreglo visible del cliente como fuente oficial del CSV.
- No meter joins con `contacts` como requisito de esta fase.
- No mezclar este rebuild con analítica comercial avanzada.
- No esconder fixes de lógica de cierre dentro de este trabajo; si aparecen, documentarlos como deuda o fix separado.

## Criterio de Éxito

El módulo de reportes debe pasar de tabla operativa limitada a vista histórica confiable, con filtros reales, paginación, CSV coherente y KPIs básicos, sin tocar negocio externo al módulo.