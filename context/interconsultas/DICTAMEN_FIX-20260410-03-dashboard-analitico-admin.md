# DICTAMEN TÉCNICO: Dashboard analítico administrativo sobre conversations

- **ID:** FIX-20260410-03
- **Fecha:** 2026-04-10
- **Solicitante:** INTEGRA
- **Estado:** ✅ VALIDADO

### A. Análisis de Causa Raíz

El modelo actual sí permite analítica administrativa básica, pero todavía no soporta analítica de performance o funnel con rigor. Hoy conviven dos universos distintos: operación en vivo sobre conversaciones no cerradas y reporteo histórico sobre conversaciones cerradas.

Métricas confiables con datos actuales:

1. Activas ahora: conversaciones con status distinto de closed, como ya consume [apps/web/src/components/DashboardMetrics.tsx](apps/web/src/components/DashboardMetrics.tsx#L21) y [apps/web/src/components/StatusBar.tsx](apps/web/src/components/StatusBar.tsx#L50).
2. Requieren atención humana ahora: needsHuman en conversaciones activas.
3. Sin leer ahora: suma de unreadCount en conversaciones activas.
4. Distribución operativa por sucursal ahora: branch en conversaciones activas, siempre que se muestre aparte el bucket sin sucursal/general.
5. Cerradas en rango: histórico por status closed con fecha efectiva closedAt || lastMessageAt en [apps/web/src/app/api/admin/reports/route.ts](apps/web/src/app/api/admin/reports/route.ts#L55) y [apps/web/src/app/api/admin/reports/route.ts](apps/web/src/app/api/admin/reports/route.ts#L136).
6. Distribución de cierres por día: KPI byDay ya implementado en [apps/web/src/app/api/admin/reports/route.ts](apps/web/src/app/api/admin/reports/route.ts#L80).
7. Cobertura de resumen: withSummary y withoutSummary ya calculados en [apps/web/src/app/api/admin/reports/route.ts](apps/web/src/app/api/admin/reports/route.ts#L97).
8. Distribución histórica por sucursal o asignación actual sobre conversaciones cerradas: útil solo como foto del documento cerrado, no como trazabilidad de proceso.

Métricas engañosas o prematuras:

1. Tiempo de resolución, SLA, primera respuesta o tiempo hasta handoff: no existe modelo de eventos con timestamps de apertura, toma humana, primera respuesta humana o resolución real.
2. Productividad por agente o comparativo IA vs humano en histórico: assignedTo es estado actual del documento, no historial de reasignaciones.
3. Tasa de reapertura o cierres netos: reabrir agrega reopenedAt, pero no limpia closedAt en [apps/web/src/app/api/conversation/reopen/route.ts](apps/web/src/app/api/conversation/reopen/route.ts#L15), así que el snapshot no distingue bien cierres invalidados.
4. Funnel por estatus en el tiempo: status es foto actual, no secuencia histórica de cambios.
5. Sucursal con más carga global si mezcla activas y cerradas en una sola cifra: combina backlog operativo con volumen histórico y produce una lectura falsa.

Riesgos de mezclar realtime + histórico en una misma pantalla:

1. Universos distintos: realtime excluye closed; histórico usa solo closed.
2. Relojes distintos: operación se lee sobre snapshot actual; histórico usa fecha efectiva closedAt || lastMessageAt.
3. Ambigüedad visual: una tarjeta de carga actual al lado de una de cierres del mes parece comparable aunque no lo sea.
4. Seguridad y alcance: la operación actual todavía descarga más datos y filtra branch en cliente en [apps/web/src/components/ChatList.tsx](apps/web/src/components/ChatList.tsx#L100), mientras reportes históricos ya viven server-side.

### B. Justificación de la Solución

Alcance mínimo viable recomendado:

1. Una sola pantalla administrativa con dos bloques explícitos: Operación actual y Histórico de cierres.
2. Operación actual: activas, requieren humano, sin leer, asignadas a IA, asignadas a humano, distribución por sucursal activa y sucursal con más carga ahora.
3. Histórico: cerradas en rango, cierres por día, porcentaje con resumen, top tags y distribución de cerradas por sucursal.
4. Si se muestra sucursal con más carga, definirla solo como conversaciones activas actuales por branch, no como mezcla con cierres.

Guardrails para SOFIA:

1. No mezclar en una misma fórmula datos de status != closed con datos de status = closed.
2. Etiquetar cada widget con su fuente temporal: Ahora o Rango histórico.
3. No construir KPIs de SLA, productividad por agente, reaperturas netas ni funnel hasta modelar eventos.
4. Tratar branch vacío o general como bucket explícito, nunca descartarlo en silencio.
5. Reutilizar la fuente histórica server-side de reportes; no duplicar analítica histórica en cliente.
6. Si se necesita un endpoint nuevo, que sea agregado administrativo, no una segunda lectura ad hoc del dashboard operativo.

### C. Instrucciones de Handoff para INTEGRA

1. La nueva SPEC debe separar semánticamente Operación actual e Histórico de cierres desde el título y criterios de aceptación.
2. La primera iteración debe prometer solo métricas de snapshot operativo y cierres históricos agregados por rango.
3. Cualquier solicitud de SLA, productividad por agente, reaperturas o funnel debe quedar fuera de scope y registrada como deuda de modelado analítico.