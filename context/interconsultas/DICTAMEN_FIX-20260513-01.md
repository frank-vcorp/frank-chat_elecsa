# DICTAMEN TÉCNICO: Revisión forense de SPEC de logging WA a agentes
- **ID:** FIX-20260513-01
- **Fecha:** 2026-05-13
- **Solicitante:** INTEGRA
- **Estado:** ✅ VALIDADO

### A. Análisis de Causa Raíz

La SPEC define bien la intención de observabilidad, pero deja tres ambigüedades que pueden contaminar datos desde la primera implementación.

1. **Cardinalidad del evento no cerrada.** La SPEC dice "un log estructurado por envío", pero los criterios de aceptación bajan eso a "al menos un log por agente notificado". En [apps/web/src/lib/aiProvider.ts](apps/web/src/lib/aiProvider.ts#L782) el flujo de handoff puede emitir más de un mensaje por agente en un mismo trigger: el aviso principal y, si existe adjunto, un segundo envío del archivo. Si no se especifica cuál de esos envíos entra al log operativo, la colección mezclará avisos primarios con mensajes auxiliares y los conteos de `template` vs `session` quedarán inflados o inconsistentes.

2. **Estado del evento mal definido para reintentos o transiciones.** La SPEC modela `status` como `attempted | sent | failed`, pero el documento sugerido solo tiene `createdAt` y no define si habrá un solo documento mutable por intento o varios documentos por transición. Sin `eventId` o correlación explícita, una implementación natural puede registrar `attempted` y luego `sent` como dos filas distintas, duplicando volumen y rompiendo métricas de éxito/fallo.

3. **`deliveryMode` no distingue modo intentado vs modo efectivo.** La regla de etiquetado liga el campo al helper invocado (`sendWhatsAppTemplate()` o `sendWhatsAppMessage()`), pero la motivación de la SPEC es validar la estrategia futura de ventana activa. Si mañana existe fallback de template a session o decisión híbrida por ventana, el esquema actual no permite saber si el sistema **intentó** template y terminó en session, o si eligió session desde el inicio. Eso debilita la trazabilidad causal que justamente se quiere habilitar.

### B. Justificación de la Solución

No corresponde implementar todavía. El ajuste correcto está en endurecer la SPEC antes de codificar para que el evento observado sea único, comparable y auditable.

La lectura mínima del flujo actual confirma que el riesgo no es teórico: el handoff masivo notifica a múltiples agentes y además puede mandar media adicional en el mismo trigger, mientras la asignación manual envía solo un aviso directo en [apps/web/src/lib/aiProvider.ts](apps/web/src/lib/aiProvider.ts#L1037). Por eso la SPEC debe fijar la unidad exacta de observación y cómo evoluciona el estado del registro.

### C. Instrucciones de Handoff para INTEGRA

1. Ajustar la SPEC para declarar explícitamente la **unidad de log**: "solo el aviso operativo principal al agente" y excluir mensajes auxiliares como reenvío de media, o bien modelarlos como `messageKind` distinto.
2. Definir si el registro será **un documento por intento** con transición de estado in-place, o **múltiples eventos append-only**. Si es por intento, agregar `eventId`, `attemptedAt` y opcionalmente `resolvedAt`; si es append-only, separar `eventType` de `status`.
3. Dividir `deliveryMode` en dos campos: `intendedDeliveryMode` y `effectiveDeliveryMode`, o documentar explícitamente que en esta iteración solo se registra el modo efectivo y que no habrá fallback dentro del mismo intento.
4. Añadir una regla de deduplicación mínima para evitar doble log por reintento accidental del mismo trigger, por ejemplo con clave compuesta `conversationId + agentId + triggerSource + eventId`.
5. Como riesgo no crítico, precisar si `agentWhatsapp` y `errorMessage` se almacenan completos o saneados; hoy la SPEC los deja abiertos y eso puede exponer PII operativa innecesaria.
