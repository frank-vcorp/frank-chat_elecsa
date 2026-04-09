# SPEC-ARCH-20260409-11

## Objetivo

Implementar Fase 1 y Fase 2 del sistema de nombres visibles de conversación para que el dashboard deje de depender del número telefónico como identificador principal y permita edición manual por parte del equipo.

## Contexto

El webhook de Twilio ya captura `ProfileName` de WhatsApp y lo guarda en `contacts.name`, pero la UI del dashboard y del chat sigue mostrando `contactId`, que hoy equivale al número telefónico. Eso deteriora la operación humana, la búsqueda y el seguimiento comercial.

La necesidad inmediata no es automatizar renombre con IA, sino aprovechar el nombre que ya entrega WhatsApp y permitir un override manual controlado por el usuario interno.

## Alcance

### Incluye

- Mostrar nombre visible en lista de conversaciones y cabecera del chat.
- Priorizar el nombre de WhatsApp como fuente inicial cuando exista.
- Permitir edición manual del nombre visible desde la UI.
- Persistir el nombre manual en un campo estable de conversación.
- Mantener el número telefónico como dato secundario o fallback.

### No Incluye (Out of Scope)

- Renombre automático por Sofía.
- Detección semántica del nombre a partir del texto conversacional.
- Reescritura del modelo completo de contactos o migraciones complejas masivas.

## Requerimientos Funcionales

1. RF-1: La conversación debe tener un nombre visible utilizable por la UI, con fallback al número cuando no exista otra fuente.
2. RF-2: Al crear contacto y conversación desde el webhook, el sistema debe preferir `ProfileName` de WhatsApp como nombre inicial visible cuando exista.
3. RF-3: La lista de conversaciones debe mostrar el nombre visible como dato principal y el número como dato secundario.
4. RF-4: La cabecera del chat debe mostrar el nombre visible y conservar el número como referencia secundaria.
5. RF-5: El usuario interno debe poder editar manualmente el nombre visible de una conversación.
6. RF-6: Una edición manual debe prevalecer sobre el nombre traído desde WhatsApp.

## Requerimientos No Funcionales

- Compatibilidad: No debe romper el flujo actual de conversaciones ya existentes sin nombre visible.
- UX: La edición manual debe ser clara, rápida y reversible en términos de experiencia.
- Seguridad: No se deben alterar permisos, autenticación ni contratos sensibles existentes.
- Mantenibilidad: La solución debe dejar clara la fuente del nombre visible y su prioridad.

## Criterios de Aceptación

- [ ] CA-1: Cuando existe `ProfileName` en WhatsApp, la conversación se muestra por ese nombre en la UI sin dejar de conservar el número.
- [ ] CA-2: Cuando no existe nombre de WhatsApp, la UI sigue funcionando con el número como fallback.
- [ ] CA-3: El usuario puede editar manualmente el nombre visible de una conversación desde la UI.
- [ ] CA-4: El nombre manual persiste y se sigue mostrando después de refrescar o reabrir la conversación.
- [ ] CA-5: La solución no rompe envío de mensajes, asignación, etiquetas, notas ni demás lógica operativa.
- [ ] CA-6: La implementación queda documentada con checkpoint o nota de cierre.

## Dependencias

- Tareas previas: Ninguna obligatoria.
- Recursos externos: Firebase Firestore, Twilio webhook existente, UI dashboard/chat existente.
- Datos necesarios: Acceso a `contacts` y `conversations`.

## Riesgos Identificados

1. Riesgo de inconsistencia entre `contacts.name` y nombre manual de conversación. Mitigación: definir prioridad explícita y persistir override manual en conversación.
2. Riesgo de afectar conversaciones existentes sin nombre. Mitigación: fallback defensivo al número en toda la UI.
3. Riesgo de scope creep hacia IA o CRM. Mitigación: limitar esta entrega a Fase 1 y 2.

## Plan de Implementación

### Fase 1: Nombre de WhatsApp en UI

- Ajustar modelo/lectura para exponer nombre visible en conversación.
- Usar `contacts.name` o equivalente como fuente inicial.
- Mostrar nombre principal y número secundario en lista/chat.

### Fase 2: Edición Manual

- Crear endpoint o mecanismo seguro para actualizar el nombre visible manual.
- Agregar affordance de edición en la UI del chat.
- Persistir y respetar la prioridad del nombre manual sobre el nombre de WhatsApp.

## Testing

- Unit Tests: helpers de resolución de nombre visible si se introducen.
- Integration Tests: creación de conversación con nombre de WhatsApp y persistencia de edición manual.
- Manual QA:
  - Validar conversación nueva con nombre de WhatsApp.
  - Validar conversación sin nombre de WhatsApp.
  - Editar manualmente nombre y refrescar.
  - Confirmar que lista y cabecera muestran el nombre correcto.

## Documentación a Actualizar

- [ ] Checkpoint de implementación
- [ ] PROYECTO.md

## Estimación

- Esfuerzo: 1 micro-sprint.
- Complejidad: Media.
- Prioridad: Alta.

## Notas Adicionales

Prioridad de nombre visible en esta entrega:

1. Nombre manual de conversación.
2. Nombre de WhatsApp (`ProfileName` / `contacts.name`).
3. Número telefónico.

---

**Creado por:** INTEGRA  
**Fecha:** 2026-04-09  
**Estado:** En Progreso  
**Asignado a:** SOFIA - Builder