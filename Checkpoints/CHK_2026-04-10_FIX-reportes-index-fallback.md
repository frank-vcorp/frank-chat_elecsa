# CHECKPOINT HOTFIX — FIX-20260410-01
## Reportes v2: fallback sin índice compuesto en producción

**Fecha:** 2026-04-10  
**Agente:** INTEGRA  
**Motivo:** La ruta pública `/api/admin/reports` estaba respondiendo 500 en producción.

## Causa más probable

La consulta de reportes dependía de un índice compuesto de Firestore (`status` + `closedAt`) que no estaba desplegado o disponible en producción al momento del uso.

## Correctivo aplicado

- `apps/web/src/app/api/admin/reports/route.ts`
- `apps/web/src/app/api/admin/reports/export/route.ts`

Se cambió la estrategia para consultar por `closedAt` y filtrar `status = "closed"` en memoria, evitando la dependencia inmediata del índice compuesto y eliminando la causa más probable del 500.

## Impacto

- El módulo de reportes y la exportación CSV dejan de depender del índice compuesto para operar.
- Se mantiene `closedAt` como pivote histórico.
- El índice compuesto sigue siendo útil como optimización futura, pero ya no bloquea el funcionamiento.

## Riesgo remanente

No fue posible correr validación runtime local en este contenedor porque no hay binarios de Node disponibles.