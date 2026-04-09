# DICTAMEN TÉCNICO: Subutilización de contexto de servicios y canalización prematura de Sofía

- **ID:** FIX-20260409-03
- **Fecha:** 2026-04-09
- **Solicitante:** INTEGRA
- **Estado:** ✅ VALIDADO

### A. Análisis de Causa Raíz

**Síntoma reportado**

Sofía canaliza a asesor por consultas de servicios aunque existe el documento local `docs/contexto_sofia/context_elecsa_servicios.md`, y además no prioriza pedir número de parte ni solicita el nombre de la empresa con naturalidad.

**Hallazgos forenses**

1. El runtime **no consume archivos locales de `docs/contexto_sofia/`**. La función `getContextDocumentsText()` solo lee Firestore en la colección `context_docs` con `active == true` y límite de 20 documentos. El archivo local de servicios no aparece referenciado en código.
2. El prompt operativo de Sofía **tampoco vive en el repo como fuente de verdad**. `getAgentPrompt("sofia")` lee `agents/sofia.prompt` desde Firestore. El archivo `update_sofia_prompt.js` es solo una utilidad de actualización, no garantía del prompt actualmente cargado.
3. La inyección adicional en `aiProvider.ts` está **hiperorientada a productos, marcas y catálogo**, con reglas absolutas y herramientas explícitas para búsqueda de inventario, pero **sin reglas equivalentes para servicios**. Eso hace que el modelo entienda “producto = debo resolver”, pero “servicio = respuesta libre / posible escalación”.
4. El prompt de referencia de Sofía refuerza un patrón de escalación defensiva: “si la consulta se vuelve técnica o necesita cotización formal → conecta con un asesor”. Si el servicio se interpreta como integración, automatización o tableros, el modelo puede clasificarlo como “tema técnico” antes de intentar responder con contexto corporativo.
5. La detección aguas abajo en webhook considera múltiples frases de transferencia como señal de handoff, así que **una sola mención verbal de pasar con asesor termina materializando la canalización**.
6. No existe evidencia en la lógica de una política estructural para **desambiguar por número de parte** ni para **capturar nombre de empresa** como dato conversacional obligatorio o persistido. Hoy eso dependería solo del wording del prompt.

**Causa raíz**

La causa principal no es que el modelo “ignore” un documento existente, sino que **ese documento local no forma parte garantizada del contexto runtime**. Incluso si su contenido ya fue copiado a `context_docs`, el sistema sigue privilegiando reglas fuertes de catálogo y escalación, mientras que los servicios quedan como conocimiento pasivo, no como flujo operativo obligatorio.

### B. Justificación de la Solución

**Diagnóstico accionable**

1. **Por qué podría estar ignorando o subutilizando los documentos de servicios**
   - Porque el archivo local no se consume directamente; solo cuenta si fue subido a `context_docs` y está `active`.
   - Porque `context_docs` entra como bloque libre de texto, pero las instrucciones duras del sistema solo existen para catálogo/herramientas, no para servicios.
   - Porque el prompt de runtime puede no contener ninguna regla explícita de “responde primero con capacidades/servicios antes de escalar”.
   - Porque el límite de 20 documentos y 250 KB puede relegar contexto útil si hay otros documentos más recientes o pesados.

2. **Qué regla falta para evitar canalización prematura**
   - Falta una regla de precedencia del tipo: **“Si la consulta es sobre capacidades, servicios, integración, automatización, manufactura de tableros, certificaciones o perfil de empresa, responde primero con información institucional disponible en contexto y solo escala si el cliente pide cotización formal, ingeniería de detalle, visita o seguimiento humano explícito.”**
   - También falta una prohibición explícita: **“No canalices por mencionar un servicio; primero valida si puedes responder con contexto corporativo.”**

3. **Si preguntar empresa y número de parte debe vivir en prompt o en lógica**
   - **Número de parte:** debe vivir en ambos, pero con responsabilidades distintas.
     - En prompt: para el tono conversacional y la política de desambiguación (“si el cliente da nombre genérico o descripción ambigua, pide número de parte antes de afirmar disponibilidad o precio”).
     - En lógica: para detectar consultas ambiguas y no dejarlo a criterio total del modelo. Si la búsqueda devuelve demasiados resultados o el input no parece SKU/MPN, la lógica debería forzar la repregunta.
   - **Nombre de empresa:** principalmente en prompt si solo se busca naturalidad comercial. Debe vivir en lógica solo si se quiere persistirlo, validarlo, reutilizarlo en handoff o usarlo en scoring/calificación.

4. **Riesgos de implementarlo mal**
   - Si se mete todo en prompt: comportamiento inconsistente, dependencia excesiva del modelo y regresiones silenciosas cuando cambie el prompt en Firestore.
   - Si se mete todo en lógica rígida: experiencia robótica, repreguntas innecesarias y fricción en consultas simples.
   - Si se obliga siempre el número de parte: Sofía puede bloquear ventas tempranas de clientes que solo describen lo que necesitan.
   - Si se pide empresa demasiado pronto o con wording fijo: se percibe scriptado y baja conversión.
   - Si se amplía la regla de “no escalar” sin límites: Sofía podría retener conversaciones que sí requieren asesor técnico o comercial.

### C. Instrucciones de Handoff para INTEGRA

1. Verificar en producción si el contenido de `docs/contexto_sofia/context_elecsa_servicios.md` fue realmente cargado a `context_docs` y está activo.
2. Ajustar el prompt operativo en Firestore para añadir una política explícita de respuesta sobre servicios antes de escalar.
3. Definir una regla híbrida:
   - Prompt para lenguaje natural y prioridad conversacional.
   - Lógica para detectar ambigüedad de producto y disparar solicitud de número de parte.
4. Si se quiere capturar “empresa” como dato útil de negocio, agregar persistencia explícita en conversación/contacto; si no, dejarlo solo como pauta de estilo en prompt.
5. Validar con casos UAT separados: servicio general, servicio + cotización, producto ambiguo por descripción, producto con SKU exacto, y saludo inicial donde se pida empresa de forma natural.