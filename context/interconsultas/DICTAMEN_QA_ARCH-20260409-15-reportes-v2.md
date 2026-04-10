# DICTAMEN QA: Reportes v2

- **ID:** ARCH-20260409-15-QA
- **Fecha:** 2026-04-09
- **Solicitante:** INTEGRA / Usuario
- **Estado:** VALIDADO

## Gaps confirmados

1. El módulo actual carece de filtros reales, paginación histórica y KPIs de supervisión.
2. La fecha mostrada debe pasar de `lastMessageAt` a `closedAt`.
3. La identidad visible debe usar `displayName` como primera opción.

## Fases recomendadas

### Fase 1

- Corregir fuente de datos, filtros y paginación.
- Mejorar tabla con nombre visible y fecha de cierre real.

### Fase 2

- Agregar KPIs básicos y distribución simple por día.
- Reordenar layout para priorizar métricas y filtros.

## Riesgos QA

1. Consultas Firestore pueden requerir índices compuestos.
2. Rangos abiertos sin control pueden degradar performance.
3. La UI puede quedar sobrecargada si se intentan demasiadas métricas en una sola entrega.

## Criterios de aceptación QA

1. Tabla, filtros y CSV usan la misma fuente filtrada.
2. La paginación no duplica resultados.
3. `closedAt` y `displayName` se reflejan correctamente.
4. El módulo sigue usable en móvil y escritorio.
5. El checkpoint documenta índices o limitaciones detectadas.