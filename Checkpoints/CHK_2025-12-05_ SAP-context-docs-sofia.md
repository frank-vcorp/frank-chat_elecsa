# Checkpoint 2025-12-05 – Context docs y Sofía

## Resumen
- Se añadió gestión de **documentos de contexto** (.md/.txt) en `admin/products`.
- Sofía ahora consume dinámicamente los documentos activos desde Firestore (`context_docs`).
- Se agregaron límites de tamaño y controles de activo/inactivo para evitar prompts excesivos.
- El endpoint `/api/agent/test` se actualizó para probar agentes usando también el contexto dinámico.

## Cambios clave

### 1. UI admin – `admin/products`
- Archivo: `apps/web/src/app/admin/products/page.tsx`
- Nuevas capacidades:
  - Subida de archivos `.md`/`.txt` como documentos de contexto.
  - Listado con:
    - Título
    - Fecha de creación
    - Tamaño aproximado en KB
    - Estado `Activo`/`Inactivo`
  - Acciones por documento:
    - Activar/Desactivar (PATCH `/api/context-docs`)
    - Eliminar (DELETE `/api/context-docs?id=...`)
  - Resumen:
    - Número de documentos activos vs total
    - Tamaño total activo y total cargado en KB
- Reglas de tamaño:
  - Máx. ~250 KB por archivo (validación en frontend + backend).

### 2. API de documentos de contexto
- Archivo: `apps/web/src/app/api/context-docs/route.ts`
- Funciones:
  - `GET`: lista documentos ordenados por `createdAt desc`.
  - `POST`: crea documento con estructura:
    - `title`, `content`, `source`
    - `active: true`
    - `size` (bytes)
    - `createdAt` (ISO)
    - Rechaza documentos > ~250 KB.
  - `DELETE`: elimina doc por `id`.
  - `PATCH`: actualiza flag `active` por `id`.

### 3. Lógica de IA – `lib/aiProvider.ts`
- Archivo: `apps/web/src/lib/aiProvider.ts`
- Nuevas piezas:
  - `getContextDocumentsText()`:
    - Lee `context_docs` donde `active == true`, ordena por `createdAt desc`, limita a 20.
    - Construye bloques `# título\ncontenido` hasta un máximo total de ~250 KB.
    - Devuelve un bloque de texto que se anexa al prompt del sistema con una nota de uso interno.
  - `getSofiaResponse(...)`:
    - Recupera prompt base del agente `sofia`.
    - Anexa el texto de contexto (si existe) y lo usa como `systemPrompt` en `callOpenAI`.
  - `testAgentWithContext(agentId, message)`:
    - Igual enfoque que Sofía, pero para cualquier agente.

### 4. Endpoint de test de agentes
- Archivo: `apps/web/src/app/api/agent/test/route.ts`
- Cambios:
  - Deja de construir el prompt y llamar a OpenAI directamente.
  - Ahora usa `testAgentWithContext(agentId, message)` de `lib/aiProvider`.
  - Esto garantiza que las pruebas de agentes también consideren los documentos de contexto activos.

## Estado y próximos pasos
- Listo para usar:
  - Subir `.md`/`.txt` desde `admin/products` como conocimiento para Sofía.
  - Activar/Desactivar documentos para ajustar qué entra al contexto.
  - Probar respuestas de agentes (especialmente `sofia`) vía `/api/agent/test` con contexto incluido.
- Pendiente (futuro):
  - Integrar SAP o una fuente equivalente para tener precios y existencias en tiempo casi real.
  - Ajustar el prompt de `sofia` con reglas de cotización, uso de datos en tiempo real y cláusula de responsabilidad sobre cambios de precios/stock.
