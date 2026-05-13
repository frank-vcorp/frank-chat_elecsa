# SPEC-ARCH-20260513-04 — Ventana Activa de WhatsApp con Agentes Humanos

- ID: ARCH-20260513-04
- Fecha: 2026-05-13
- Autoriza: INTEGRA - Arquitecto
- Implementa: SOFIA - Builder
- Prioridad: Crítica
- Estado: [~] Planificado

## Objetivo

Permitir que, una vez que un agente humano haya respondido por WhatsApp al número de Sofía, los siguientes avisos dirigidos a ese mismo agente se envíen como mensaje normal de sesión (`session/freeform`) en lugar de plantilla, mientras la ventana de 24 horas siga activa.

## Problema actual

Hoy los avisos a agentes humanos se envían como plantilla siempre que exista `TWILIO_WA_TEMPLATE_SID`.

Eso es correcto para el primer contacto fuera de sesión, pero produce fricción y riesgo operativo cuando:

1. el mismo agente recibe múltiples handoffs legítimos en un mismo día
2. Meta bloquea plantillas repetidas al mismo destinatario (`63049`)
3. el agente ya respondió al número de Sofía, pero el sistema no aprovecha esa ventana para enviar mensajes normales

En términos de Meta, lo que importa es si el agente ya respondió al número del negocio y abrió una ventana activa. El sistema actual todavía no usa esa señal.

## Resultado esperado

Flujo objetivo:

1. Sofía envía un primer aviso por plantilla al agente.
2. El agente responde por WhatsApp al número de Sofía.
3. El sistema identifica que el número entrante pertenece a un agente humano.
4. Se marca una ventana activa para ese agente.
5. Si llega otro cliente que debe canalizarse al mismo agente dentro de esa ventana, el aviso sale como mensaje normal (`session`) y no como plantilla.

## Comportamiento requerido

### A. Detección de agentes en webhook

Cuando entre un mensaje por `POST /api/twilio/webhook`, el sistema debe normalizar el número remitente y verificar si coincide con el `whatsapp` de algún documento en la colección `agents`.

Si coincide:

1. NO tratar el mensaje como cliente normal.
2. NO crear contacto/conversación de cliente.
3. Procesar ese mensaje como interacción operativa de agente.
4. Actualizar el estado de ventana activa del agente.
5. Responder con acuse corto por Twilio para confirmar recepción.

### B. Ventana activa de agente

El sistema debe registrar al menos:

- `lastAgentInboundAt`
- `lastAgentInboundText` (opcional y saneado)
- `waSessionOpenUntil`

Regla mínima:

- si el agente respondió, `waSessionOpenUntil = now + 24h`

### C. Selección de canal al notificar

Antes de notificar a un agente humano:

1. si `waSessionOpenUntil > now` → usar `sendWhatsAppMessage()`
2. si no existe ventana activa o ya expiró → usar `sendWhatsAppTemplate()`

### D. Copy operativo al agente

El mensaje de aviso debe incluir instrucción explícita:

- tomar la conversación
- no olvidar cerrarla en el chat

Copy mínimo sugerido:

"Nueva conversación asignada. No olvides cerrar la conversación en el chat cuando termines de atenderla."

### E. Comandos iniciales soportados

Para esta iteración, no es obligatorio interpretar semánticamente `TOMADA` o `CERRAR` para cambiar estado de la conversación.

Sí es obligatorio que cualquier respuesta del agente:

1. abra ventana activa
2. no sea tratada como mensaje de cliente
3. quede registrada como actividad del agente

## Alcance

- Archivos probables a modificar:
  - `apps/web/src/app/api/twilio/webhook/route.ts`
  - `apps/web/src/lib/aiProvider.ts`
  - opcional: `apps/web/src/lib/types.ts` si SOFIA necesita tipado explícito para metadata de agente
- Debe reutilizar la colección `agents` como fuente de verdad para números WhatsApp
- Debe convivir con la SPEC de logging:
  - `context/SPECs/SPEC-ARCH-20260513-03_log-wa-agentes.md`

## Fuente de verdad

La colección `agents` es la única fuente de verdad para determinar si un número entrante pertenece a un agente humano.

No se permite hardcodear números en el código.

## Requerimientos funcionales

1. RF-1: El webhook debe distinguir entre mensajes entrantes de cliente y mensajes entrantes de agente.
2. RF-2: Un mensaje entrante desde un número registrado en `agents.whatsapp` no debe crear conversación de cliente.
3. RF-3: Al detectar mensaje de agente, el sistema debe abrir o refrescar una ventana activa de 24h.
4. RF-4: `handOffToHuman()` debe usar mensaje libre si el agente tiene ventana activa; en otro caso, plantilla.
5. RF-5: `notifyAgentManualAssignment()` debe seguir la misma regla.
6. RF-6: El aviso al agente debe incluir recordatorio explícito de cerrar la conversación en el chat.
7. RF-7: La estrategia debe seguir funcionando aunque se agreguen o eliminen agentes en Firestore sin cambios de código.

## Criterios de aceptación

- CA-1: Si el agente nunca ha respondido al número de Sofía, el siguiente aviso sale por plantilla.
- CA-2: Si el agente responde por WhatsApp, el sistema registra ventana activa de 24h.
- CA-3: Si llega otro handoff al mismo agente dentro de esa ventana, el aviso sale como mensaje normal.
- CA-4: El mensaje entrante del agente no genera contacto ni conversación de cliente.
- CA-5: La decisión de canal también aplica a asignación manual, no solo a handoff automático.
- CA-6: Si la ventana expira, el sistema vuelve a usar plantilla.
- CA-7: El log operativo de la SPEC `ARCH-20260513-03` permite ver si el envío fue `template` o `session`.

## No incluye

- Automatizar que `TOMADA` cambie el estado del chat en dashboard
- Automatizar que `CERRAR` cierre la conversación en dashboard
- Resumen acumulado de múltiples conversaciones para el mismo agente
- Dashboard administrativo para sesiones activas por agente

## Diseño recomendado

### Opción de persistencia sugerida

Guardar los metadatos de sesión WhatsApp directamente en el documento del agente, por ejemplo:

```ts
{
  whatsapp: string,
  waSessionOpenUntil?: Timestamp,
  lastAgentInboundAt?: Timestamp,
  lastAgentInboundText?: string,
}
```

Esto evita colecciones paralelas innecesarias para una regla de decisión simple por agente.

### Normalización de número

La comparación debe hacerse con números normalizados en formato compatible con E.164, eliminando espacios, prefijos `whatsapp:` y caracteres no numéricos antes del match.

### Acuse sugerido al agente

"Recibido. Tus próximos avisos podrán llegar por mensaje normal mientras tu ventana siga activa. No olvides cerrar la conversación en el chat."

## Riesgos

1. Si el campo `agents.whatsapp` está inconsistente entre agentes, el webhook puede no reconocer correctamente algunos números.
2. Si se procesa cualquier respuesta del agente como apertura de ventana sin reglas mínimas, se puede abrir sesión con mensajes accidentales o ruido.
3. Si el webhook no separa bien agente vs cliente, se contaminará la base de conversaciones.

## Mitigaciones

1. Normalizar `agents.whatsapp` antes de comparar.
2. Limitar esta iteración a apertura de ventana por cualquier respuesta del agente, pero registrando el texto para auditoría inicial.
3. Acompañar la implementación con la SPEC de logging para auditar `template` vs `session` desde el día 1.

## Dependencias

- `context/SPECs/SPEC-ARCH-20260513-03_log-wa-agentes.md`
- lógica actual de notificación en `apps/web/src/lib/aiProvider.ts`
- webhook de Twilio en `apps/web/src/app/api/twilio/webhook/route.ts`

## Notas para SOFIA

- No meter números hardcodeados.
- Usar `agents` como origen de verdad.
- Mantener el cambio acotado a detección de agente, apertura de ventana y selección de canal.
- No implementar todavía cierre automático por comando WhatsApp; eso requiere otra SPEC.