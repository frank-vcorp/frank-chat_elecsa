# CHECKPOINT — AJUSTE PROMPT COMERCIAL SOFÍA
**ID:** ARCH-20260409-13  
**Fecha:** 2026-04-09  
**Agente:** INTEGRA  
**Alcance:** Parche pequeño de comportamiento en producción vía `aiProvider.ts`

---

## Objetivo

Reducir escalación prematura en consultas de servicios, obligar desambiguación natural por número de parte en productos ambiguos y pedir empresa de forma comercial no robótica.

## Cambio aplicado

- Se centralizó un bloque de reglas runtime en `SOFIA_RUNTIME_RULES` dentro de `apps/web/src/lib/aiProvider.ts`.
- Se inyecta tanto en `getSofiaResponse()` como en `testAgentWithContext()` para alinear producción y pruebas.
- No se tocó lógica de negocio, handoff, auth ni contratos de API.

## Reglas nuevas

1. Servicios/capacidades: responder primero con contexto institucional y no escalar automáticamente.
2. Escalación: solo proponer coordinación con asesor cuando haya solicitud formal, revisión técnica especializada, visita, ingeniería de detalle o humano explícito.
3. Productos ambiguos: pedir primero número de parte; si no lo tienen, pedir marca, modelo o aplicación.
4. Perfil comercial: pedir empresa de forma natural cuando la conversación ya vaya hacia cotización o seguimiento.

## Riesgo controlado

- El parche vive en código para impacto inmediato en producción.
- Se evitó wording que pueda disparar handoff textual accidental.
- El cambio es reversible y de bajo radio de impacto.

## Pendiente recomendado

- Verificar que el documento de servicios relevante esté realmente activo en `context_docs` de producción.
- Si el comportamiento funciona bien, mover estas reglas al prompt administrable en Firestore en una segunda iteración.