# HANDOFF ARCH-20260410-03

## Tarea

Implementación del dashboard analítico de reportes según:

- [context/SPECs/SPEC-ARCH-20260410-03-dashboard-analitico-reportes.md](context/SPECs/SPEC-ARCH-20260410-03-dashboard-analitico-reportes.md)

## Regla de Alcance

Trabajo enfocado en ampliar `/admin/reports` como dashboard administrativo. No tocar lógica de negocio de cierre, reapertura, routing o agentes fuera de la lectura analítica.

## Reparto

### SOFIA - Builder

- Responsable principal de implementación.
- Entrega por fases:
  1. contrato analítico para operación actual e histórico
  2. UI dashboard analítico
  3. QA visual + checkpoint
- Debe mantener separadas semánticamente las métricas actuales y las históricas.

### Deby

- Interconsulta si aparece cualquiera de estas condiciones:
  - métricas contradictorias entre bloques
  - ambigüedad de datos por reaperturas o estatus
  - bug repetido al calcular distribuciones

### Gemini

- Auditoría final de claridad, performance y semántica de métricas.

## Guardrails

- No mezclar operación actual e histórico en una sola cifra ambigua.
- No introducir SLA ni productividad por agente sin contrato de datos explícito.
- No eliminar la tabla histórica existente.
- No convertir V1 en plataforma BI completa.

## Criterio de Éxito

El usuario debe poder entrar a `/admin/reports` y entender rápidamente el estado general de la operación, la carga por sucursal, la distribución de estatus y el histórico del período, conservando la tabla detallada para análisis puntual.