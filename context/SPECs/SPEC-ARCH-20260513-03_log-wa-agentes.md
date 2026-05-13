# SPEC-ARCH-20260513-03 — Log Operativo de Avisos WhatsApp a Agentes

- ID: ARCH-20260513-03
- Fecha: 2026-05-13
- Autoriza: INTEGRA - Arquitecto
- Implementa: SOFIA - Builder
- Prioridad: Alta
- Estado: [~] Planificado

## Objetivo

Agregar trazabilidad operativa por agente para los mensajes de aviso enviados desde el número de Sofía a agentes humanos, etiquetando cada envío como `template` o `session` (mensaje normal dentro de ventana activa), para validar durante los primeros días que el cambio de estrategia WhatsApp se esté comportando correctamente.

La unidad exacta de observación en esta SPEC es **el aviso operativo principal al agente humano**. Quedan fuera del log primario los mensajes auxiliares, por ejemplo reenvío de adjuntos o media del cliente.

## Problema actual

Hoy el sistema sí envía avisos de handoff por WhatsApp a agentes humanos, pero no deja una traza estructurada y fácil de auditar por agente sobre:

1. qué agente recibió el aviso
2. a qué conversación correspondía
3. si el envío salió como plantilla o como mensaje normal
4. si fue disparado por handoff automático o por asignación manual

Esto vuelve difícil verificar en producción si la futura lógica de ventana activa con agentes está funcionando bien o si se siguen enviando plantillas cuando ya debería usarse sesión normal.

## Comportamiento requerido

Cada vez que el sistema intente enviar un aviso WhatsApp a un agente humano, debe registrar un log estructurado por envío.

En esta iteración, "aviso" significa exclusivamente el **mensaje principal de notificación al agente**. Si el flujo además reenvía un adjunto o media, ese envío secundario no debe contaminar este log operativo, salvo que SOFIA agregue explícitamente un campo separado `messageKind` y lo marque como `auxiliary_media`.

El log debe indicar, al menos:

1. `conversationId`
2. `agentId`
3. `agentName`
4. `agentWhatsapp`
5. `branch`
6. `triggerSource` (`handoff_auto` o `manual_assignment`)
7. `eventId` único por intento de aviso
8. `messageKind` con valor `primary_alert`
9. `intendedDeliveryMode` (`template` o `session`)
10. `effectiveDeliveryMode` (`template` o `session`)
11. `templateSid` si aplica
12. `attemptedAt`
13. `resolvedAt` si aplica
14. resultado (`attempted`, `sent`, `failed`)
15. código/mensaje de error saneado si existe

## Alcance

- Archivos probables a modificar:
  - `apps/web/src/lib/aiProvider.ts`
  - opcional: helper compartido dentro de `apps/web/src/lib/` si SOFIA quiere evitar duplicación
- Persistencia sugerida:
  - `system_logs` o colección nueva tipo `agent_wa_logs`
- Debe cubrir ambos flujos ya existentes:
  - `handOffToHuman()`
  - `notifyAgentManualAssignment()`

## Diseño recomendado

### Opción preferida de persistencia

Crear colección dedicada `agent_wa_logs` para no mezclar esta telemetría operativa con el ruido general de `system_logs`.

El modelo de persistencia de esta SPEC es: **un documento por intento de aviso principal**. Ese documento puede nacer como `attempted` y luego actualizarse a `sent` o `failed` sobre el mismo `eventId`.

Documento sugerido:

```ts
{
  eventId: string,
  conversationId: string,
  agentId: string,
  agentName: string,
  agentWhatsappMasked: string,
  branch: string,
  triggerSource: "handoff_auto" | "manual_assignment",
  messageKind: "primary_alert",
  intendedDeliveryMode: "template" | "session",
  effectiveDeliveryMode: "template" | "session",
  templateSid?: string | null,
  status: "attempted" | "sent" | "failed",
  attemptedAt: serverTimestamp(),
  resolvedAt?: serverTimestamp() | null,
  errorCode?: string | null,
  errorMessage?: string | null,
}
```

### Regla de deduplicación

Cada documento debe representar un único intento identificado por `eventId`.

La clave mínima de correlación recomendada es:

`conversationId + agentId + triggerSource + eventId`

No se deben crear dos documentos distintos para el mismo intento cuando el estado transicione de `attempted` a `sent` o `failed`.

### Regla de etiquetado

- Si el sistema decide usar `sendWhatsAppTemplate()` → `intendedDeliveryMode = "template"`
- Si el sistema decide usar `sendWhatsAppMessage()` → `intendedDeliveryMode = "session"`
- Si el envío finalmente sale por `sendWhatsAppTemplate()` → `effectiveDeliveryMode = "template"`
- Si el envío finalmente sale por `sendWhatsAppMessage()` → `effectiveDeliveryMode = "session"`

En esta iteración, si no existe fallback dentro del mismo intento, ambos campos pueden coincidir. La separación es obligatoria para dejar preparada la trazabilidad de la estrategia futura.

### Política mínima de saneamiento

- `agentWhatsapp` no debe persistirse completo en claro; guardar versión enmascarada, por ejemplo últimos 4 dígitos visibles.
- `errorMessage` debe guardarse resumido/saneado, evitando volcar payloads completos o PII innecesaria.

## Requerimientos funcionales

1. RF-1: Todo aviso saliente a agente humano debe dejar registro estructurado.
2. RF-2: El registro debe poder filtrarse por agente y por conversación.
3. RF-3: El registro debe distinguir entre modo intentado y modo efectivo de entrega.
4. RF-4: Debe diferenciar si el disparo vino de handoff automático o asignación manual.
5. RF-5: Si Twilio devuelve error, el log debe persistir con `status = failed` y datos mínimos del error.
6. RF-6: El log de esta SPEC solo cubre el aviso principal al agente; no debe mezclar adjuntos o media auxiliar salvo modelado explícito.
7. RF-7: No debe haber duplicación de filas para el mismo intento cuando cambie el estado del envío.

## Criterios de aceptación

- CA-1: Un handoff automático genera un documento de log por intento de aviso principal y por agente notificado.
- CA-2: Una asignación manual genera un documento de log del aviso principal al agente asignado.
- CA-3: El campo `intendedDeliveryMode` muestra `template` cuando el sistema intenta usar `sendWhatsAppTemplate()`.
- CA-4: El campo `effectiveDeliveryMode` muestra `session` cuando el envío finalmente usa `sendWhatsAppMessage()`.
- CA-5: Un fallo Twilio queda visible con `status = failed`, `errorCode` y `resolvedAt`.
- CA-6: Un mismo intento no produce dos documentos distintos por transición `attempted -> sent/failed`.
- CA-7: Los mensajes auxiliares como reenvío de media no inflan el conteo del log principal.
- CA-8: Durante los primeros días de operación se puede inspeccionar por agente si el sistema sigue usando demasiadas plantillas o ya empezó a usar mensajes normales cuando corresponda.

## No incluye

- Dashboard analítico para visualizar estos logs
- Comandos de agente por WhatsApp (`TOMADA`, `CERRAR`)
- Conmutación automática entre plantilla y sesión (eso va en la SPEC siguiente)
- Logging exhaustivo de mensajes auxiliares o media adjunta fuera del aviso principal

## Riesgo

Bajo. Es un cambio de observabilidad y trazabilidad; no altera por sí mismo la lógica de routing ni la asignación de conversaciones.

## Nota de arquitectura

Esta SPEC es un prerequisito práctico para la siguiente iteración: habilitar que, cuando un agente ya haya respondido al número de Sofía, los siguientes avisos a ese mismo agente salgan como mensaje de sesión normal en lugar de plantilla.