# SPEC-ARCH-20260410-03

## Objetivo

Ampliar el módulo de reportes administrativos para convertirlo en un dashboard analítico útil para supervisión diaria, separando con claridad la operación actual de los chats y el histórico de cierres, con métricas accionables por estatus, sucursal, asignación y volumen.

## Contexto

Reportes v2 ya resolvió la base histórica filtrable: tabla de conversaciones cerradas, filtros, exportación y KPIs mínimos. Sin embargo, el usuario necesita una capa adicional de analítica administrativa que responda preguntas operativas más amplias: cuántos chats existen, cómo se distribuyen por estatus, qué sucursal trae más carga, qué porcentaje opera IA vs humanos y cómo se mueve el volumen en el tiempo.

La ampliación correcta no es mezclar todo en una sola cifra generalista. El sistema ya tiene dos naturalezas distintas:

- operación actual en tiempo real sobre conversaciones no cerradas
- histórico de cierres sobre conversaciones cerradas en un rango

Si ambas se mezclan sin separación visual y semántica, el dashboard puede verse más completo pero volverse engañoso.

## Interconsultas consideradas

- Deby: [context/interconsultas/DICTAMEN_FIX-20260410-03-dashboard-analitico-admin.md](context/interconsultas/DICTAMEN_FIX-20260410-03-dashboard-analitico-admin.md)
- Gemini: [context/interconsultas/DICTAMEN_QA_ARCH-20260410-03-dashboard-analitico-reportes.md](context/interconsultas/DICTAMEN_QA_ARCH-20260410-03-dashboard-analitico-reportes.md)

## Alcance

### Incluye

- Ampliar `/admin/reports` hacia un dashboard con dos bloques explícitos:
  - Operación actual
  - Histórico del período
- Mostrar métricas globales de todos los chats basadas en datos existentes y confiables.
- Mostrar distribución por estatus de conversación.
- Mostrar actividad por sucursal.
- Mostrar reparto IA vs humano.
- Mostrar tendencias básicas del período seleccionado.
- Mantener la tabla histórica existente como capa de detalle debajo del dashboard.

### No Incluye (Out of Scope)

- SLA formal, tiempo medio de resolución o productividad por agente si no hay contrato de eventos confiable.
- Métricas comerciales avanzadas como ventas, conversión o valor monetario.
- Reescribir el modelo de datos de conversaciones o eventos.
- Crear aún una infraestructura de agregados persistentes si la V1 puede resolverse con lecturas server-side razonables.
- Reemplazar por completo DashboardMetrics fuera de admin, salvo reutilización parcial.

## Principios Arquitectónicos

1. Operación actual e histórico deben verse como bloques distintos, no como una sola lectura mezclada.
2. Las métricas de V1 deben derivarse solo de campos ya existentes y confiables: `status`, `branch`, `assignedTo`, `needsHuman`, `unreadCount`, `tags`, `closedAt`, `lastMessageAt`.
3. La capa analítica debe salir de lectura server-side dedicada y no de listeners cliente improvisados.
4. La tabla histórica actual permanece como detalle analítico, no se elimina.
5. Si la escala o costo crecen, la evolución correcta posterior será una colección de agregados; no es obligatoria en esta V1.

## Requerimientos Funcionales

1. RF-1: La pantalla `/admin/reports` debe mostrar un bloque de Operación actual con métricas de conversaciones activas.
2. RF-2: La pantalla debe mostrar un bloque Histórico del período seleccionado con métricas agregadas sobre conversaciones cerradas.
3. RF-3: El dashboard debe incluir distribución por estatus de todos los chats considerados por la consulta actual.
4. RF-4: El dashboard debe mostrar sucursales con mayor carga usando una definición explícita y visible.
5. RF-5: El dashboard debe mostrar reparto entre conversaciones asignadas a IA y a humano.
6. RF-6: El usuario debe entender qué métricas corresponden a “ahora” y cuáles al rango histórico aplicado.
7. RF-7: La tabla de detalle de conversaciones cerradas debe seguir disponible debajo del resumen ejecutivo.
8. RF-8: Los filtros de rango y búsqueda deben seguir gobernando el bloque histórico y su tabla.

## Definiciones Operativas de V1

- **Operación actual:** conversaciones con estado distinto de `closed`.
- **Histórico del período:** conversaciones cuyo cierre efectivo cae dentro del rango seleccionado.
- **Sucursal con más carga:** sucursal con mayor número de conversaciones activas actuales.
- **Reparto IA vs humano:** distribución por `assignedTo === "ai"` frente a cualquier otro valor no vacío o asignación humana.

## KPIs mínimos de V1

### Operación actual

- Chats activos ahora
- Requieren humano
- Sin leer totales
- IA vs humano
- Top sucursales activas
- Distribución por estatus activos

### Histórico del período

- Total de cerradas
- Con resumen IA
- Sin resumen
- Cierres por día
- Top sucursales por volumen histórico
- Top etiquetas del período

## Requerimientos No Funcionales

- Performance: evitar listeners masivos innecesarios dentro de `/admin/reports`; preferir lectura server-side consolidada para histórico y una lectura acotada para operación actual.
- UX: la pantalla debe priorizar lectura rápida ejecutiva antes que detalle tabular.
- Claridad semántica: toda tarjeta o gráfico debe indicar si representa “actual” o “histórico”.
- Compatibilidad: usable en escritorio y móvil dentro del shell admin existente.
- Mantenibilidad: separar componentes visuales de cada bloque para crecer sin convertir la página en un archivo monolítico.

## Criterios de Aceptación

- [ ] CA-1: El dashboard muestra dos bloques explícitos: Operación actual e Histórico del período.
- [ ] CA-2: El usuario puede identificar cuántos chats están activos, cuántos requieren humano y cuántos no leídos existen.
- [ ] CA-3: El dashboard muestra distribución por estatus y por sucursal sin mezclar operativo e histórico en una sola cifra ambigua.
- [ ] CA-4: El reparto IA vs humano aparece de forma comprensible y coherente con los datos existentes.
- [ ] CA-5: La tabla histórica actual sigue funcionando y queda visualmente subordinada al resumen analítico.
- [ ] CA-6: Los filtros de rango siguen gobernando el bloque histórico y la exportación.
- [ ] CA-7: La pantalla mantiene buena lectura en desktop y móvil.
- [ ] CA-8: No se introducen métricas engañosas como SLA o productividad por agente sin datos confiables.
- [ ] CA-9: La implementación queda documentada con checkpoint y backlog actualizado.

## Riesgos Identificados

1. Riesgo de mezclar presente e histórico en una sola lectura. Mitigación: bloques separados y copy explícito.
2. Riesgo de sobrealcance hacia BI completo. Mitigación: limitar V1 a KPIs confiables con datos actuales.
3. Riesgo de costo por queries amplias. Mitigación: consolidar lecturas server-side y capar V1 a métricas realmente usadas.
4. Riesgo de definir mal “sucursal con más carga”. Mitigación: fijar en SPEC que se refiere a carga activa actual.

## Plan de Implementación

### Fase 1: Contrato analítico V1

- Crear o ampliar una ruta administrativa para devolver métricas de operación actual.
- Ampliar la respuesta histórica con agregados adicionales del período.
- Definir shape de datos para tarjetas, top sucursales y distribuciones.

### Fase 2: Dashboard visual

- Rediseñar `/admin/reports` para introducir encabezado ejecutivo y dos bloques analíticos.
- Integrar tarjetas KPI y visualizaciones sobrias.
- Mantener la tabla histórica debajo del resumen.

### Fase 3: QA y cierre

- Validar consistencia entre métricas, filtros y tabla.
- Confirmar copy semántico de “actual” vs “histórico”.
- Documentar riesgos remanentes y límites de V1.

## Testing

- Unit Tests: helpers de agregación si se extraen.
- Integration Tests: respuesta de la ruta analítica y consistencia con filtros.
- Manual QA:
  - Validar que un chat activo no contamina métricas históricas.
  - Validar que una conversación cerrada sí entra al bloque histórico dentro del rango.
  - Validar que sucursal líder y distribución por estatus se entienden correctamente.
  - Validar la legibilidad del dashboard en desktop y móvil.

## Documentación a Actualizar

- [ ] [PROYECTO.md](PROYECTO.md)
- [ ] Checkpoint de implementación
- [ ] Nota técnica de límites analíticos de V1 si aplica

## Estimación

- Esfuerzo: 1 a 2 micro-sprints.
- Complejidad: Alta.
- Prioridad: Alta.

## Micro-Sprint Propuesto

## 📋 MICRO-SPRINT: Dashboard Analítico de Reportes
**Fecha:** 2026-04-10  
**Proyecto:** Frank Chat ELECSA  
**Duración estimada:** 2-4 horas por fase inicial  

### 🎯 Entregable Demostrable
> El usuario puede entrar a `/admin/reports` y entender de un vistazo la operación actual de chats, la distribución por estatus, la sucursal con más carga y el histórico del período, sin perder la tabla de detalle.

### ✅ Tareas Técnicas
- [ ] (3) Definir contrato analítico para operación actual e histórico
- [ ] (3) Rediseñar `/admin/reports` como dashboard analítico
- [ ] (2) Validar consistencia visual y semántica

### 🧪 Cómo Demostrar
1. Ir a `/admin/reports`.
2. Ver bloque de Operación actual con carga por sucursal y reparto IA/humano.
3. Ver bloque Histórico del período con cierres, etiquetas y tendencia, seguido de la tabla detalle.

---

**Creado por:** INTEGRA  
**Fecha:** 2026-04-10  
**Estado:** Planificado  
**Asignado a:** SOFIA - Builder