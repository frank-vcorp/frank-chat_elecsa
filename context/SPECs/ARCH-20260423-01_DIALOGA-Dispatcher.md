# SPEC-ARCH-20260423-01: Implementación de DIALOGA como Agente Despachador

## Objetivo

Evolucionar al agente `DIALOGA` de un simple asistente conversacional a un **despachador de tareas inteligente** (Dispatcher) dentro del ecosistema INTEGRA. Su función principal será ser el primer punto de contacto, analizar la intención del usuario y delegar las tareas complejas al agente especialista adecuado, optimizando así el uso de tokens y la eficiencia del flujo de trabajo.

## Contexto

Actualmente, los agentes especializados (`SOFIA`, `Deby`, etc.) se invocan manualmente. Esto requiere que el usuario sepa de antemano qué agente es el correcto para cada tarea. La implementación de `DIALOGA` como despachador simplificará la interacción, permitiendo al usuario expresar su necesidad en lenguaje natural y dejando que el sistema determine el mejor agente para el trabajo. Esto también reduce el consumo de tokens de los modelos más potentes (y costosos) para tareas de triaje.

## Alcance

### Incluye

- Modificar el archivo `DIALOGA.agent.md`.
- Añadir la herramienta `runSubagent` a los permisos de `DIALOGA`.
- Implementar una nueva lógica en el prompt de `DIALOGA` para que analice, proponga y delegue tareas.
- Definir claramente los criterios para delegar a cada uno de los agentes especialistas.

### No Incluye (Out of Scope)

- Modificar los prompts de los otros agentes (`SOFIA`, `Deby`, etc.).
- Crear nuevos agentes.
- Implementar la lógica de ejecución de las tareas en sí mismas (solo la delegación).

## Requerimientos Funcionales

1.  **[RF-1] Análisis de Intención:** `DIALOGA` debe ser capaz de analizar el prompt del usuario para determinar si es una pregunta general o una tarea accionable compleja.
2.  **[RF-2] Propuesta de Delegación:** Si la tarea es compleja, `DIALOGA` no debe intentar resolverla. En su lugar, debe responder al usuario proponiendo la delegación al agente especialista que considere más adecuado, explicando brevemente el porqué.
3.  **[RF-3] Mapeo de Delegación:** `DIALOGA` debe mapear correctamente los tipos de tareas a los agentes especialistas:
    - Implementación, creación de código/UI -> `SOFIA - Builder`
    - Análisis de errores, bugs, debugging -> `Deby`
    - Planificación, arquitectura, diseño de features -> `INTEGRA - Arquitecto`
    - Auditoría, calidad, hosting, CI/CD -> `GEMINI-CLOUD-QA`
    - Actualización de `PROYECTO.md` y estados -> `CRONISTA-Estados-Notas`
4.  **[RF-4] Ejecución de Delegación:** Una vez que el usuario apruebe (implícita o explícitamente), `DIALOGA` debe usar la herramienta `runSubagent` para pasar la tarea al agente correspondiente.

## Requerimientos No Funcionales

- **Performance:** La respuesta de `DIALOGA` para proponer la delegación debe ser casi instantánea, aprovechando la velocidad del modelo Haiku.
- **Seguridad:** `DIALOGA` no debe tener acceso a herramientas de modificación de archivos (`editFiles`, etc.), solo a `runSubagent`.

## Criterios de Aceptación

- [ ] **[CA-1]** Al recibir un prompt como "Arregla este bug en `login.js`", `DIALOGA` responde proponiendo delegar la tarea a `@Deby`.
- [ ] **[CA-2]** Al recibir un prompt como "Crea un nuevo componente de React para el perfil de usuario", `DIALOGA` responde proponiendo delegar la tarea a `@SOFIA - Builder`.
- [ ] **[CA-3]** Al recibir un prompt como "¿Qué es una API REST?", `DIALOGA` responde directamente sin delegar.
- [ ] **[CA-4]** El archivo `DIALOGA.agent.md` ha sido actualizado para incluir la nueva lógica de prompt y la herramienta `runSubagent` en su `frontmatter`.
- [ ] **[CA-5]** El agente `DIALOGA` no intenta escribir o editar código por sí mismo.

## Plan de Implementación

### Fase 1: Actualización del Agente

- [ ] Modificar el archivo `/home/frank/.config/Code/User/prompts/DIALOGA.agent.md`.
- [ ] Añadir `agent/runSubagent` a la lista de `tools`.
- [ ] Reemplazar el prompt existente con las nuevas instrucciones de "Despachador Inteligente".

### Fase 2: Pruebas de Delegación

- [ ] Ejecutar un caso de prueba para cada uno de los agentes especialistas para verificar que `DIALOGA` los invoca correctamente.

## Estimación

- **Esfuerzo:** 0.5 horas
- **Complejidad:** Baja
- **Prioridad:** Media
