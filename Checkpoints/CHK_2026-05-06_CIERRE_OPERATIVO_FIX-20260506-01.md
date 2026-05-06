# CHK — CIERRE: FIX-20260506-01 Routing WA + Asignación + Operación de Asesores
**ID:** ARCH-20260506-01  
**Fecha:** 2026-05-06  
**Agente:** INTEGRA - Arquitecto  
**Base técnica:** `FIX-20260506-01`  
**Checkpoint relacionado:** `Checkpoints/CHK_2026-05-06_FIX-20260506-01_twilio-12300.md`

---

## Resumen ejecutivo

Sesión enfocada en cerrar fallas del flujo de handoff de Sofía a agentes humanos en WhatsApp y dashboard.

Se corrigieron cuatro capas del problema:

1. webhook Twilio compatible con `text/xml` para eliminar error `12300`
2. restauración del payload correcto de plantilla WhatsApp a agentes
3. detección y asignación robusta por ciudad/sucursal, incluyendo variantes reales de escalación
4. consistencia operativa del dashboard cuando un asesor toma, responde y cierra atención

Además, se actualizó la guía operativa para que los asesores puedan continuar el seguimiento directo por WhatsApp del cliente sin perder control en el dashboard.

## Entregable demostrable

Flujo esperado al cierre de sesión:

1. Sofía detecta que ya debe escalar.
2. Si el cliente confirma ciudad o sucursal, la conversación se asigna correctamente al agente humano/sucursal correspondiente.
3. El agente recibe notificación por WhatsApp también cuando la asignación es manual.
4. Cuando el asesor responde, desaparece la alerta de `Solicitud de atención humana`.
5. El asesor puede seguir al cliente por WhatsApp, pero debe mantener el dashboard actualizado y cerrar el caso ahí al terminar.

## Cambios aplicados

### Backend / Routing / Notificaciones

- `apps/web/src/app/api/twilio/webhook/route.ts`
  - respuesta XML para Twilio (`12300`)
  - restauración de handoff confiable
  - nuevos patrones de escalación: cotización, `te conecto`, `déjame conectarte`, seguimiento directo
  - early handoff al detectar ciudad en contexto ya escalado, sin esperar otra respuesta de Sofía

- `apps/web/src/lib/aiProvider.ts`
  - restauración de variable `{{5}}` como resumen puro en plantilla aprobada
  - helper `notifyAgentManualAssignment()` para notificación WA en asignación manual

- `apps/web/src/app/api/conversation/assign/route.ts`
  - al asignar manualmente a un agente humano, se dispara notificación por WhatsApp

- `apps/web/src/app/api/chat/send/route.ts`
  - al responder un asesor humano, se apaga `needsHuman`
  - se conserva `assignedTo` real y ya no se pisa con `agent`

### Operación / Documentación

- `docs/GUIA_AGENTES.md`
  - se aclara qué hacer cuando llega aviso por WhatsApp de Sofía
  - se permite continuar la atención directa por WhatsApp
  - se documenta que el dashboard sigue siendo la fuente de verdad para tomar y cerrar la conversación

## Commits de la sesión

- `ddf3560` fix webhook XML + revert de payload plantilla
- `a0707f3` detectar frases de cotización que implican handoff
- `0368c8c` detectar variantes `te conecto` / `déjame conectarte`
- `84546d8` asignar agente al detectar ciudad sin esperar a Sofía
- `e57b22f` notificar por WhatsApp al agente en asignación manual
- `491746c` corrección de tipo para build de Vercel
- `3ce0df1` limpiar alerta al responder un agente
- `69cf3ff` guía operativa: WhatsApp + cierre en dashboard

## Validación realizada

- `get_errors` en archivos modificados: sin errores relevantes de TypeScript
- build de Vercel: fallo detectado por `string | null` vs `string | undefined`, luego corregido en `491746c`
- push a `main` realizado para todos los fixes listados
- validación funcional basada en casos reales reportados durante la sesión:
  - Armando Jerónimo / `CDMX Centro`
  - notificación WA a agentes
  - alerta humana que no se apagaba tras respuesta del asesor

## Riesgos residuales

1. Conversaciones viejas pueden seguir con estado inconsistente (`needsHuman=true`, branch correcto pero sin agente concreto).
2. Sigue pendiente un barrido correctivo retroactivo en Firestore para casos ya abiertos antes de los fixes.
3. La recepción efectiva del WhatsApp por parte del agente depende de que el documento `agents/{id}` tenga `whatsapp` válido y de que Meta/Twilio no bloquee el envío por factores externos.

## Próximos pasos sugeridos

1. Crear script de reparación retroactiva para conversaciones ya abiertas con handoff incompleto.
2. Validar 3 a 5 casos reales por sucursal desde producción.
3. Revisar si conviene automatizar cierre o seguimiento cuando el asesor atiende completamente fuera del dashboard.

## Cierre formal

Se completa el cierre de sesión con checkpoint de entrega y actualización de guía operativa.
Queda pendiente sincronizar `PROYECTO.md` con CRONISTA para reflejar esta sesión como avance consolidado.