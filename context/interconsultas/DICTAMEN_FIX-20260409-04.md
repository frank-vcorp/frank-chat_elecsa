# DICTAMEN TÉCNICO: Validación de parche de comportamiento comercial de Sofía

- **ID:** FIX-20260409-04
- **Fecha:** 2026-04-09
- **Solicitante:** INTEGRA
- **Estado:** ✅ VALIDADO

### A. Análisis de Causa Raíz

El punto propuesto sí cae dentro del alcance de [apps/web/src/lib/aiProvider.ts](apps/web/src/lib/aiProvider.ts) porque ahí se ensamblan las reglas duras del system prompt de Sofía y ya existe una política explícita para productos, marcas y catálogo. En concreto, [getSofiaResponse](apps/web/src/lib/aiProvider.ts#L109) concatena instrucciones absolutas al prompt base y por eso es un lugar coherente para un parche pequeño de comportamiento conversacional.

El principal riesgo no está solo en el modelo, sino en la capa aguas abajo: [detectEscalation](apps/web/src/app/api/twilio/webhook/route.ts#L14) considera handoff textual frases como “te paso con”, “te comunico con”, “te van a llamar” o “un asesor te contacta”. Si el nuevo wording usa esas expresiones aunque la intención sea solo ofrecer apoyo futuro, la conversación se escalará igual.

También hay un riesgo de mezclar tres políticas distintas en una sola regla dura: priorización de contexto institucional, desambiguación de producto y captura de empresa. Las dos primeras sí encajan como guardrails del prompt; la tercera solo debe vivir ahí si es de tono comercial, no si se quiere persistencia o validación estructurada.

### B. Justificación de la Solución

Recomendación:

1. **Sí, puede vivir en [apps/web/src/lib/aiProvider.ts](apps/web/src/lib/aiProvider.ts)** si el cambio es pequeño y estrictamente de comportamiento/prompting, no de workflow de negocio.
2. **No lo dejaría como reglas hardcoded permanentes** si esperas iterarlo seguido. Para estabilización rápida en producción sirve; para operación normal conviene moverlo luego al prompt administrable en Firestore porque [getAgentPrompt](apps/web/src/lib/aiProvider.ts#L58) ya toma la base desde ahí.
3. **No uses wording que parezca handoff**. Evita frases como: “te paso con”, “te comunico con”, “un asesor te contacta”, “te van a llamar”, “te transfiero”.
4. **Usa wording de contención primero**. Ejemplos seguros: “Te comparto primero cómo lo manejamos”, “A nivel de servicios sí contamos con…”, “Si después requieres una cotización formal o revisión técnica, con gusto lo coordinamos”.
5. **Número de parte**: correcto como regla en prompt, pero con matiz. No lo pidas siempre; pídelo cuando el cliente mencione un producto por nombre comercial genérico, descripción ambigua o aplicación. Si no lo tiene, pedir marca/modelo/aplicación es buen fallback.
6. **Nombre de empresa**: correcto en prompt solo como pauta de naturalidad comercial. Evita formularlo como requisito temprano o bloqueante.

Wording a evitar:

- “Eso lo ve un asesor”
- “Ese tema ya es técnico”
- “Te canalizo”
- “Te transfiero”
- “No es mi área”
- “Para eso necesito pasarte con alguien”

Wording recomendado:

- “Con gusto te doy primero una orientación general sobre ese servicio.”
- “Si me compartes el número de parte te respondo con más precisión; si no lo tienes, me sirve marca, modelo o aplicación.”
- “Y para prepararte mejor la propuesta, ¿de qué empresa nos contactas?”

### C. Instrucciones de Handoff para INTEGRA

1. Aplicar el parche en [apps/web/src/lib/aiProvider.ts](apps/web/src/lib/aiProvider.ts#L134) como guardrail corto y explícito.
2. Redactar las nuevas reglas sin ninguna frase que coincida con los patrones de [apps/web/src/app/api/twilio/webhook/route.ts](apps/web/src/app/api/twilio/webhook/route.ts#L14).
3. Si el comportamiento necesita seguir ajustándose en operación, mover esas reglas al prompt base administrado en Firestore y dejar en código solo restricciones críticas y estables.