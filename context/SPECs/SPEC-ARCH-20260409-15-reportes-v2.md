# SPEC-ARCH-20260409-15

## Objetivo

Reconstruir el módulo de reportes administrativos para que deje de ser una tabla operativa limitada y se convierta en una vista histórica confiable de conversaciones cerradas, con filtros reales, exportación coherente y KPIs básicos útiles para operación y supervisión.

## Contexto

La ruta actual [apps/web/src/app/admin/reports/page.tsx](apps/web/src/app/admin/reports/page.tsx) no funciona como un módulo de reportes real. Hoy consulta las últimas 50 conversaciones con `status = closed`, usa `lastMessageAt` como proxy de cierre, muestra `contactId` como identidad principal y exporta exactamente el arreglo ya cargado en pantalla.

El sistema ya persiste mejores datos para reporteo: `closedAt`, `summary` y `summarizedAt` al cerrar conversación en [apps/web/src/lib/conversation.ts](apps/web/src/lib/conversation.ts). Además, el modelo de conversación ya soporta `displayName`, lo que permite mejorar la legibilidad del reporte sin joins costosos con contactos.

La deuda principal no es visual, sino de contrato de lectura histórica. Si se amplía la pantalla actual sin corregir fuente de datos, filtros y exportación, el módulo seguirá entregando información engañosa.

## Interconsultas consideradas

- Deby: dictamen forense de alcance y riesgos para Reportes v2 en [context/interconsultas/DICTAMEN_FIX-20260409-05-reportes-v2.md](context/interconsultas/DICTAMEN_FIX-20260409-05-reportes-v2.md)
- Gemini: auditoría QA/arquitectura para fases y criterios de aceptación en [context/interconsultas/DICTAMEN_QA_ARCH-20260409-15-reportes-v2.md](context/interconsultas/DICTAMEN_QA_ARCH-20260409-15-reportes-v2.md)

## Alcance

### Incluye

- Rehacer la lectura de reportes usando `closedAt` como fecha primaria de cierre.
- Exponer nombre visible con prioridad `displayName || contactId`.
- Implementar filtros reales por rango de fechas y búsqueda por cliente o teléfono.
- Implementar paginación real en lugar de una ventana fija de 50 registros.
- Exportar CSV desde la misma consulta filtrada que alimenta el reporte.
- Agregar KPIs básicos de alto valor y bajo riesgo sobre el subconjunto filtrado.
- Rediseñar la UI del módulo para jerarquizar métricas, filtros y tabla.

### No Incluye (Out of Scope)

- Redefinir la lógica de cierre, reapertura o generación de resumen.
- Migraciones históricas masivas o saneamiento retroactivo de datos.
- Analítica comercial avanzada sin campos de resultado normalizados.
- Dashboard en tiempo real para conversaciones cerradas.
- Cruces complejos con `contacts` o colecciones adicionales como requisito para esta entrega.

## Decisiones Arquitectónicas

1. Reportes v2 debe basarse en lectura histórica server-side o mediante una ruta administrativa dedicada; no debe depender de filtrar documentos ya renderizados en cliente.
2. La fecha de referencia para reportes cerrados es `closedAt`, nunca `lastMessageAt`.
3. La identidad visible primaria debe resolverse con `displayName || contactId` para evitar joins innecesarios.
4. Los KPIs iniciales deben derivarse del mismo subconjunto filtrado de conversaciones cerradas, para que tabla, métricas y CSV sean coherentes entre sí.
5. La ambigüedad de reaperturas y doble resumen se registra como deuda técnica relacionada, pero no bloquea esta primera reconstrucción si el reporte se define sobre el estado actual de conversaciones cuyo estado final sea `closed`.

## Rutas y archivos objetivo

- [apps/web/src/app/admin/reports/page.tsx](apps/web/src/app/admin/reports/page.tsx)
- [apps/web/src/lib/types.ts](apps/web/src/lib/types.ts)
- [apps/web/src/app/api/admin/reports/route.ts](apps/web/src/app/api/admin/reports/route.ts)
- [apps/web/src/components](apps/web/src/components)
- Documentación y checkpoint de implementación

## Requerimientos Funcionales

1. RF-1: El módulo debe mostrar conversaciones cerradas usando `closedAt` como fecha de cierre.
2. RF-2: El módulo debe permitir filtrar por rango de fechas sin depender de filtrado solo visual.
3. RF-3: El módulo debe permitir búsqueda textual por nombre visible o teléfono.
4. RF-4: El reporte debe mostrar como nombre principal `displayName` cuando exista y usar `contactId` como fallback.
5. RF-5: La tabla debe paginar resultados para no quedar limitada a una muestra fija de 50 conversaciones.
6. RF-6: La exportación CSV debe respetar exactamente los filtros activos del reporte.
7. RF-7: El módulo debe mostrar KPIs básicos coherentes con el rango consultado: total cerradas, total con resumen, total sin resumen y distribución por día.
8. RF-8: La pantalla debe conservar buen uso en móvil y escritorio dentro del shell admin ya responsive.

## Requerimientos No Funcionales

- Performance: La carga inicial debe acotarse por rango de fechas razonable y paginación por cursor; no se debe descargar historial completo en cliente.
- Seguridad: La lectura debe permanecer en contexto administrativo; no se deben alterar reglas ni permisos existentes.
- Compatibilidad: Debe funcionar correctamente en móvil, tablet y escritorio dentro del admin actual.
- UX: Los filtros deben ser comprensibles, el estado vacío debe ser útil y la jerarquía visual debe priorizar métricas antes que detalle tabular.
- Mantenibilidad: La lógica de consulta, mapeo y exportación debe quedar desacoplada de la vista para permitir crecimiento futuro.

## Criterios de Aceptación

- [ ] CA-1: La fecha de cierre mostrada y exportada proviene de `closedAt`.
- [ ] CA-2: El nombre del cliente en tabla y CSV usa `displayName || contactId`.
- [ ] CA-3: El filtro por rango de fechas modifica la consulta real y cambia tabla, KPIs y CSV.
- [ ] CA-4: La búsqueda textual filtra por nombre visible y teléfono sin romper paginación.
- [ ] CA-5: La tabla deja de depender de `limit(50)` como límite rígido y soporta carga incremental o paginada.
- [ ] CA-6: Los KPIs básicos coinciden con el subconjunto filtrado visible del reporte.
- [ ] CA-7: El módulo conserva usabilidad en escritorio y móvil sin scroll horizontal indebido.
- [ ] CA-8: La implementación no toca lógica de cierre, reapertura, asignación ni resumen fuera del alcance de lectura del módulo.
- [ ] CA-9: El checkpoint documenta cualquier índice de Firestore requerido para las nuevas consultas.

## Dependencias

- Tareas previas: Shell admin responsive ya entregado.
- Recursos externos: Next.js, Firebase Firestore, Tailwind CSS.
- Datos necesarios: `closedAt`, `summary`, `displayName`, `contactId`, `tags`, `assignedTo`, `branch` cuando existan en conversación.

## Riesgos Identificados

1. Riesgo de seguir usando proxies operativos como `lastMessageAt`. Mitigación: fijar `closedAt` como pivote obligatorio en SPEC y QA.
2. Riesgo de filtros falsos en cliente. Mitigación: consulta administrativa real server-side y exportación basada en la misma fuente.
3. Riesgo de requerir índices compuestos en Firestore. Mitigación: documentar índices necesarios en checkpoint y validar en QA.
4. Riesgo de sobrealcance hacia analítica avanzada. Mitigación: limitar V1 a KPIs básicos y tabla histórica confiable.
5. Riesgo de inconsistencia por conversaciones reabiertas. Mitigación: definir explícitamente que Reportes v2 V1 reporta conversaciones cuyo estado actual es `closed` y registrar la semántica avanzada como deuda separada.

## Plan de Implementación

### Fase 1: Contrato de lectura histórica

- Extender tipos necesarios para soportar `closedAt` y demás campos usados por el reporte.
- Crear ruta administrativa server-side para obtener dataset filtrado y paginado.
- Normalizar respuesta de reporte para tabla, métricas y CSV.

### Fase 2: UI Reportes v2

- Rediseñar cabecera del módulo con resumen, filtros y CTA de exportación.
- Reemplazar tabla actual por una versión conectada a filtros y paginación real.
- Mostrar nombre visible, fecha de cierre real, tags y resumen con mejor jerarquía.

### Fase 3: KPIs y exportación coherente

- Calcular KPIs básicos del subconjunto filtrado.
- Integrar mini visualización o distribución diaria simple si no incrementa complejidad excesiva.
- Alinear exportación CSV con la misma consulta del reporte.

### Fase 4: QA y cierre

- Validar filtros, CSV, paginación y estados vacíos.
- Documentar índices necesarios y riesgos remanentes.
- Generar checkpoint de implementación.

## Testing

- Unit Tests: helpers de serialización de fila, formato de nombre visible y construcción de query params si se extraen.
- Integration Tests: ruta administrativa de reportes con filtros, paginación y exportación.
- Manual QA:
  - Validar coincidencia entre `closedAt` y fecha mostrada.
  - Validar nombre visible con y sin `displayName`.
  - Validar rango de fechas, búsqueda y paginación.
  - Validar que el CSV respeta filtros activos.
  - Validar comportamiento en móvil y escritorio.

## Documentación a Actualizar

- [ ] [PROYECTO.md](PROYECTO.md)
- [ ] Checkpoint de implementación de SOFIA
- [ ] Nota de índices Firestore si aplica

## Estimación

- Esfuerzo: 1 a 2 micro-sprints.
- Complejidad: Media-Alta.
- Prioridad: Alta.

## Micro-Sprint Propuesto

## 📋 MICRO-SPRINT: Reconstrucción Reportes v2
**Fecha:** 2026-04-09  
**Proyecto:** Frank Chat ELECSA  
**Duración estimada:** 2-4 horas por fase inicial  

### 🎯 Entregable Demostrable
> El usuario puede abrir Reportes, filtrar conversaciones cerradas por fecha, ver KPIs básicos confiables y exportar un CSV consistente con esos filtros.

### ✅ Tareas Técnicas
- [ ] (3) Crear lectura histórica server-side y paginación real
- [ ] (3) Rehacer UI del módulo con filtros y KPIs básicos
- [ ] (2) Alinear exportación CSV, QA e índices requeridos

### 🧪 Cómo Demostrar
1. Ir a `/admin/reports`.
2. Elegir un rango de fechas y buscar una conversación por nombre o teléfono.
3. Ver que la tabla, los KPIs y el CSV reflejan el mismo subconjunto filtrado.

## Handoff Recomendado

Delegar implementación a SOFIA con foco en:

- confiabilidad histórica antes que cosmética
- filtros reales, no visuales
- exportación coherente con la query activa
- crecimiento del módulo sin tocar lógica de negocio externa

---

**Creado por:** INTEGRA  
**Fecha:** 2026-04-09  
**Estado:** Planificado  
**Asignado a:** SOFIA - Builder