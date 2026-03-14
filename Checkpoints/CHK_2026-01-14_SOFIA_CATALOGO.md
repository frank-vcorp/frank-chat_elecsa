# Checkpoint Enriquecido - Inyección de Catálogo de Productos al Prompt de Sofía

## 📋 Metadata

| Campo                | Valor                                  |
| -------------------- | -------------------------------------- |
| **Fecha**            | 2026-01-14                             |
| **Agente**           | SOFIA (GitHub Copilot - Claude Opus 4) |
| **Tiempo Invertido** | ~30 minutos                            |
| **Estado**           | ✅ Completado                          |
| **Sprint/Iteración** | Fase 3 - Mejoras de IA                 |
| **Versión**          | v0.3.0                                 |

## 🎯 Objetivo de la Tarea

### Descripción

Modificar `aiProvider.ts` para que los productos cargados vía Excel/CSV en `/admin/products` se inyecten automáticamente al prompt de Sofía, permitiendo que la IA tenga acceso en tiempo real al catálogo actualizado de precios.

### Problema Detectado

El sistema tenía dos fuentes de datos separadas:

1. **`products/`** (Firestore): Productos cargados por Excel → **NO se usaban en el prompt**
2. **`context_docs/`** (Firestore): Documentos .md/.txt → **SÍ se inyectaban**

Sofía no podía ver los productos del catálogo dinámico, a pesar de que el prompt mencionaba "Tu cerebro es el archivo: catalogo_alta_rotacion_sofia_fichas_v1.pdf".

### Alcance

- ✅ Incluido: Inyección automática de productos activos al prompt
- ✅ Incluido: Carga en paralelo para mejor performance
- ✅ Incluido: Actualización de función de test de agentes
- ❌ Excluido: Cambios al prompt base de Sofía (ya está bien estructurado)
- ❌ Excluido: Cambios a la UI de admin

### Criterios de Aceptación

- [x] Los productos con `status: 'active'` se inyectan al prompt
- [x] Formato legible: `SKU | Descripción | Precio | Moneda | Proveedor`
- [x] Límite de ~150KB para no exceder contexto de OpenAI
- [x] La función `testAgentWithContext` también incluye productos
- [x] Sin errores de TypeScript

## 📝 Cambios Realizados

### Archivos Modificados

| Archivo                          | Líneas +/- | Tipo de Cambio           |
| -------------------------------- | ---------- | ------------------------ |
| `apps/web/src/lib/aiProvider.ts` | +69/-12    | Nueva función + refactor |

### Detalle de Cambios

#### 1. Nueva función `getProductsCatalogText()`

```typescript
async function getProductsCatalogText(): Promise<string>;
```

- Lee productos con `status: 'active'` de Firestore
- Formatea cada producto como: `- SKU | Descripción | Precio | Moneda | Proveedor`
- Límite de 150KB para catálogo
- Log de cuántos productos se cargaron

#### 2. Modificación de `getSofiaResponse()`

- Carga en **paralelo**: `Promise.all([prompt, context, products])`
- Construye prompt final: `base + catálogo + contexto`

#### 3. Modificación de `testAgentWithContext()`

- Ahora también incluye productos al probar agentes desde `/admin/agents`

## 🏗️ Decisiones Técnicas

### ADR-002: Inyección de Catálogo al Prompt

**Estado:** Aceptada

**Contexto:**
Los productos del Excel no se inyectaban al prompt de Sofía. Existían dos opciones:

1. Subir el catálogo como documento de contexto (.md/.txt)
2. Modificar el código para leer de `products/`

**Opciones Consideradas:**

1. **Opción A: Context Docs**
   - ✅ Pros: Sin cambios de código
   - ❌ Contras: Requiere re-subir manualmente cada vez que cambian precios

2. **Opción B: Inyección desde `products/`**
   - ✅ Pros: Sincronización automática con Excel
   - ✅ Pros: Los cambios de precios se reflejan inmediatamente
   - ❌ Contras: Requiere cambio de código

**Decisión:**
Opción B - El cliente actualiza precios frecuentemente vía Excel. La sincronización automática es crítica para el negocio.

**Consecuencias:**

- Positivas: Precios siempre actualizados sin intervención manual
- Negativas: Mayor carga en cada request (se lee toda la colección `products/`)
- Mitigación: Límite de 150KB y carga en paralelo

### ADR-003: Formato de Productos en Prompt

**Estado:** Aceptada

**Decisión:**
Usar formato de tabla simple: `SKU | Descripción | Precio | Moneda | Proveedor`

**Justificación:**

- Fácil de parsear por la IA
- Compacto (menos tokens)
- Compatible con el prompt existente que dice "Formato: SKU | Descripción | Precio orientativo | Moneda"

## 🧪 Tests y Validación

### Validación de Código

- [x] Sin errores de TypeScript
- [x] Archivo compila correctamente
- [ ] Build de Next.js (dependencias no instaladas localmente)

### Validación Manual Pendiente

- [ ] Deploy a Vercel
- [ ] Probar con mensaje de WhatsApp preguntando por un SKU real
- [ ] Verificar que Sofía responde con precio correcto

## 📊 Estructura del Prompt Final

```
┌─────────────────────────────────────────────────────┐
│ 1. PROMPT BASE                                      │
│    - Rol y personalidad                             │
│    - Adaptabilidad de tono                          │
│    - Reglas técnicas de lectura                     │
│    - Regla de oro (cantidad/ciudad)                │
│    - Lógica de navegación (semáforo)               │
│    - Ejemplos few-shot                              │
├─────────────────────────────────────────────────────┤
│ 2. CATÁLOGO DE PRODUCTOS (NUEVO)                   │
│    ## CATÁLOGO DE PRODUCTOS ELECSA (X productos)   │
│    - SKU1 | Desc | 498.49 | MXN | ABB              │
│    - SKU2 | Desc | 786.62 | USD | Siemens          │
│    ...                                              │
├─────────────────────────────────────────────────────┤
│ 3. DOCUMENTOS DE CONTEXTO (si hay activos)         │
│    Info adicional de .md/.txt                       │
└─────────────────────────────────────────────────────┘
```

## 🚀 Próximos Pasos

- [ ] Hacer commit y push a GitHub
- [ ] Verificar deploy automático en Vercel
- [ ] Probar respuesta de Sofía con productos del catálogo
- [ ] Considerar caché de productos si hay problemas de performance

## 📎 Referencias

- Archivo modificado: `apps/web/src/lib/aiProvider.ts`
- Prompt de Sofía: Firestore `agents/sofia`
- Catálogo: Firestore `products/`
