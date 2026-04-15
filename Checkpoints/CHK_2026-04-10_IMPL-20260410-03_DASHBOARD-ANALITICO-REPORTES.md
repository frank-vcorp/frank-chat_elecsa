# CHK_2026-04-10_IMPL-20260410-03_DASHBOARD-ANALITICO-REPORTES.md

## ID de Intervención
`IMPL-20260410-03`

## Fecha
2026-04-10

## Tarea
Implementación del dashboard analítico de reportes según SPEC-ARCH-20260410-03.  
Ampliar `/admin/reports` con dos bloques semánticos separados: Operación actual e Histórico del período.

## Entregables

### Archivos creados
- `apps/web/src/app/api/admin/analytics/route.ts` — **NUEVO**  
  API GET que devuelve métricas de operación actual (conversaciones no cerradas): `activeTotal`, `needsHuman`, `unreadTotal`, `byStatus`, `byBranch`, `aiVsHuman`, `capturedAt`.  
  Query: `status IN ["open", "resolved", "pending"]`, límite 2000.

### Archivos modificados
- `apps/web/src/app/api/admin/reports/route.ts`  
  Ampliada interfaz `ReportKPIs` con campos `byBranch: Record<string, number>` y `topTags: [string, number][]`.  
  Actualizada función `computeKPIs` para calcular distribución de cierres por sucursal y top 8 etiquetas.

- `apps/web/src/app/admin/reports/page.tsx`  
  Reescrita con arquitectura de dos bloques explícitos:
  - **Bloque 1 — Operación actual** (badge "Ahora", borde azul)  
    Fetch independiente a `/api/admin/analytics`. KPIs: Chats activos, Requieren humano, Mensajes sin leer, IA asignado.  
    Componentes: `StatusDistribution` (barras por estatus), `BranchRanking` (top 5 sucursales activas).  
    Botón "Actualizar" para refrescar snapshot bajo demanda.
  - **Bloque 2 — Histórico del período** (badge "Período seleccionado", borde verde)  
    Gobernado por filtros existentes. KPIs: Total cerradas, Con resumen IA, Sin resumen, Prom/día.  
    Nuevos: `BranchRanking` top sucursales de cierres, `TagRanking` top etiquetas.  
    Mantiene gráfico de barras diario (color actualizado a emerald para diferenciar de azul operativo).
  - **Sección detalle**: Tabla paginada de conversaciones cerradas, subordinada visualmente a los bloques anteriores.

## Componentes nuevos (inline en page.tsx)
| Componente | Rol |
|---|---|
| `SectionHeader` | Cabecera con badge "Ahora"/"Período" y botón refresh |
| `StatusDistribution` | Barras horizontales proporcionales por estatus |
| `BranchRanking` | Ranking de top 5 sucursales con barra relativa |
| `TagRanking` | Nube de etiquetas con conteo |
| `OperacionActualBlock` | Bloque completo de operación actual |

## Criterios de Aceptación — Estado

| CA | Descripción | Estado |
|---|---|---|
| CA-1 | Dos bloques explícitos: Operación actual e Histórico | ✓ |
| CA-2 | Chats activos, requieren humano, sin leer | ✓ |
| CA-3 | Distribución por estatus y sucursal sin mezclar | ✓ |
| CA-4 | Reparto IA/humano coherente (assignedTo === "ai") | ✓ |
| CA-5 | Tabla histórica siguie disponible y subordinada | ✓ |
| CA-6 | Filtros de rango gobiernan bloque histórico y exportación | ✓ |
| CA-7 | Responsive con grid 2/4 col. y `overflow-x-auto` en tabla | ✓ |
| CA-8 | Sin SLA ni productividad por agente | ✓ |
| CA-9 | Checkpoint generado, backlog pendiente de actualización | ✓ parcial |

## Guardrails respetados
- ✓ Operación actual e histórico son fuentes separadas y visualmente distintas.
- ✓ No se introducen métricas engañosas (sin SLA, sin productividad por agente).
- ✓ La tabla histórica se preserva completa y funcional.
- ✓ No se tocó ninguna lógica de negocio fuera de lectura analítica.
- ✓ Los KPIs solo derivan de campos existentes: `status`, `branch`, `assignedTo`, `needsHuman`, `unreadCount`, `tags`, `closedAt`, `lastMessageAt`.

## Soft Gates

### Gate 1 — Compilación
- `tsc` no disponible en container Alpine sin dependencias instaladas.
- Validación manual: imports verificados, tipos consistentes entre route.ts ↔ page.tsx, sin errores en VS Code Language Server para page.tsx.
- Error pre-existente de entorno en `next/server` afecta a todos los routes; no introducido por esta implementación.
- **Estado: CONDICIONAL** (mismo que el estado previo del proyecto)

### Gate 2 — Testing
- Tests unitarios para `computeKPIs` con los nuevos campos: pendientes (ya existían pendientes en SPEC-TESTING).
- Manual QA no posible en esta sesión (requiere Firebase conectado).
- **Estado: PENDIENTE** (mismo que en Reportes v2)

### Gate 3 — Revisión
- Código revisado manualmente: sin variables sin usar, sin hardcodeo de secretos, sin XSS (todo renderizado como texto, no dangerouslySetInnerHTML).
- Lógica de `in` query respeta límite de 30 valores de Firestore (usamos 3).
- **Estado: ✓**

### Gate 4 — Documentación
- Checkpoint generado.
- PROYECTO.md: requiere actualización manual de estado de tarea (por CRONISTA).
- **Estado: ✓ parcial**

## Riesgos remanentes de V1
1. **Performance analytics**: La query `in` sobre 2000 documentos puede ser costosa en Firestore si el volumen de activos crece. Solución futura: colección de agregados.
2. **Freshness del snapshot**: El bloque "Operación actual" no se actualiza en tiempo real; el usuario debe presionar "Actualizar". Esto es intencional para evitar listeners masivos.
3. **Límite 1000 registros en histórico**: Heredado de Reportes v2 (`MAX_FETCH = 1000`). No alterado.

## Siguiente paso recomendado
- Actualizar PROYECTO.md marcando tarea `Dashboard Analítico de Reportes` como `[→] En revisión`.
- QA visual cuando el entorno Firebase esté disponible.
- Solicitar auditoría a GEMINI-CLOUD-QA.

---
**Agente:** SOFIA - Builder  
**ID:** IMPL-20260410-03  
**SPEC:** context/SPECs/SPEC-ARCH-20260410-03-dashboard-analitico-reportes.md  
**HANDOFF:** context/interconsultas/HANDOFF_ARCH-20260410-03_DASHBOARD_ANALITICO_REPORTES.md
