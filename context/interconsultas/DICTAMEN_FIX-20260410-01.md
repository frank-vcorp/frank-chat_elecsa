# DICTAMEN TÉCNICO: 500 en /api/admin/reports por consulta Firestore de reportes

- **ID:** FIX-20260410-01
- **Fecha:** 2026-04-10
- **Solicitante:** Usuario
- **Estado:** ✅ VALIDADO

### A. Análisis de Causa Raíz

El 500 más probable en producción pública proviene de una excepción `FAILED_PRECONDITION` de Firestore por índice compuesto faltante para la consulta de reportes. La ruta construye una query con igualdad en `status`, ordenamiento por `closedAt` y filtros de rango opcionales sobre `closedAt`. Ese patrón requiere índice compuesto y el propio código lo documenta explícitamente.

Hallazgos forenses:

- [apps/web/src/app/api/admin/reports/route.ts](apps/web/src/app/api/admin/reports/route.ts#L121) usa `where("status", "==", "closed")` junto con `orderBy("closedAt", "desc")`.
- [apps/web/src/app/api/admin/reports/route.ts](apps/web/src/app/api/admin/reports/route.ts#L129) y [apps/web/src/app/api/admin/reports/route.ts](apps/web/src/app/api/admin/reports/route.ts#L137) agregan rango `>=` y `<=` sobre `closedAt`.
- [apps/web/src/app/api/admin/reports/export/route.ts](apps/web/src/app/api/admin/reports/export/route.ts#L61) replica la misma forma de query, por lo que exportación y vista comparten el mismo riesgo.
- [apps/web/src/app/api/admin/reports/route.ts](apps/web/src/app/api/admin/reports/route.ts#L104) y [apps/web/src/app/api/admin/reports/export/route.ts](apps/web/src/app/api/admin/reports/export/route.ts#L50) ya advierten que el índice Firestore requerido es `status ASC | closedAt DESC`.
- [firestore.indexes.json](firestore.indexes.json) declara ese índice, pero [firebase.json](firebase.json#L2) solo referencia el archivo; eso no demuestra que el índice haya sido desplegado al proyecto de producción.
- El checkpoint de entrega dejó la validación runtime pendiente y pidió confirmar que el índice exista en Firestore: [Checkpoints/CHK_2026-04-09_IMPL-20260409-02_reportes-v2.md](Checkpoints/CHK_2026-04-09_IMPL-20260409-02_reportes-v2.md#L74) y [Checkpoints/CHK_2026-04-09_IMPL-20260409-02_reportes-v2.md](Checkpoints/CHK_2026-04-09_IMPL-20260409-02_reportes-v2.md#L110).

Hipótesis descartadas como causa principal:

- Documentos legacy sin `closedAt`: no suelen provocar 500; quedan excluidos del `orderBy`/rango o no matchean la query.
- Forma inválida de query: la combinación igualdad en un campo + rango y `orderBy` en el mismo campo de rango (`closedAt`) es válida en Firestore; el problema típico aquí es el índice.
- `page` y `pageSize`: esos parámetros no participan en la query Firestore; solo afectan el slicing en memoria.

### B. Justificación de la Solución

El fix más seguro y rápido para producción es desplegar el índice compuesto ya definido en [firestore.indexes.json](firestore.indexes.json). Es el menor cambio posible, no altera comportamiento funcional, no toca datos y resuelve tanto la vista como la exportación si el error actual es `missing index`, que es el escenario de mayor probabilidad.

Como hardening secundario, conviene ajustar ambas rutas para detectar `failed-precondition` y devolver un error operativo explícito en vez de 500 genérico, pero eso es complementario; no sustituye el despliegue del índice.

### C. Instrucciones de Handoff para SOFIA

1. Verificar en Firebase Console o con CLI si el índice `conversations: status ASC, closedAt DESC` existe en el proyecto de producción.
2. Si no existe, desplegar índices con el proyecto correcto usando el contenido actual de [firestore.indexes.json](firestore.indexes.json).
3. Reprobar [apps/web/src/app/api/admin/reports/route.ts](apps/web/src/app/api/admin/reports/route.ts) y [apps/web/src/app/api/admin/reports/export/route.ts](apps/web/src/app/api/admin/reports/export/route.ts) con `dateFrom`, `dateTo`, `page` y `pageSize`.
4. Solo si el índice ya existe y el 500 persiste, capturar el mensaje exacto del backend para revisar una causa secundaria como proyecto Firebase incorrecto o credenciales apuntando a otro entorno.