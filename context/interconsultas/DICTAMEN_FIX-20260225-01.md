# DICTAMEN TÉCNICO: Auditoría Forense Function Calling Catálogo
- **ID:** FIX-20260225-01
- **Fecha:** 2026-02-25
- **Solicitante:** Usuario (Frank) / SOFIA
- **Estado:** ✅ VALIDADO (CON ADVERTENCIAS DE FASE 2)

### A. Análisis de Causa Raíz y Auditoría Qodo
Se auditó la regresión de arquitectura de `getProductsCatalogText` a `searchProductsInDB` en `apps/web/src/lib/aiProvider.ts`. 

**Hallazgos de la Auditoría:**
1. **Regresión Funcional (Búsqueda Limitada)**: La solución actual de Búsqueda Genérica solo descarga y filtra sobre los primeros `200` productos activos por limitación de Firebase. Si el producto buscado está en la posición 3,000, la herramienta no lo encontrará y Sofía dirá que "no hay coincidencia".
2. **Índices Firestore**: La búsqueda por SKU (`.where('sku','==',... ).where('status','==','active')`) requerirá que exista un Índice Compuesto en Firebase. Si no existe, esta línea fallará en producción.
3. **Pérdida de Prompt Caching**: Al migrar a la estructura nativa de `tools` de Anthropic, se omitió el bloque `cache_control: { type: 'ephemeral' }` que optimizaba costos.

### B. Justificación de la Solución
El código implementado por SOFIA logra evitar el colapso inmediato del servidor y el gasto excesivo de Base de Datos al subir 12,500 productos. Es una solución de emergencia válida ("Salvavidas"). Sin embargo, las advertencias de búsqueda incompleta son esperadas dado que Firestore no es una base de datos vectorial de texto completo.

### C. Instrucciones de Handoff para el Usuario / SOFIA
1. **Validar Índice**: Entrar a la Consola de Firebase -> Firestore -> Índices, y asegurar que existe un índice compuesto para la colección `products` con los campos `sku` (Ascendente) y `status` (Ascendente).
2. **Siguiente Sprint (Fase 2 Obligatoria)**: Se requiere urgentemente una integración con Algolia, Typesense o Firebase Vector Extension. El filtro local en memoria (`Array.includes`) sobre 200 documentos no escalará a nivel de UX cuando los vendedores busquen entre 12,500 ítems reales.
3. **Optimización de Costos**: Considerar re-agregar `cache_control` al array de herramientas para que la API de Anthropic devuelva el caché.
