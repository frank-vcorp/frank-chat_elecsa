# CHK — SPRINT 2: Dashboard Conversacional Responsive
**ID:** IMPL-20260409-02  
**Fecha:** 2026-04-09  
**Agente:** SOFIA - Builder  
**Sprint:** 2/3 — Dashboard responsivo + ChatWindow + ChatList

---

## Resumen

Segunda fase. Se resolvió el flujo mobile-first del dashboard y el panel de notas.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/dashboard/page.tsx` | Single-panel en móvil (lista/chat sin overlap); split view con resize se preserva en desktop. Detección de viewport con `useEffect + window innerWidth`. Botón "Volver" en móvil cuando hay conversación activa. `ArrowLeft` importado. |
| `apps/web/src/components/ChatWindow.tsx` | 1) Notes panel → bottom sheet en móvil (`fixed inset-x-0 bottom-0 h-[65vh] rounded-t-2xl`) vs overlay en desktop (`absolute right-4 top-[80px] w-80`). 2) Toolbar → `overflow-x-auto no-scrollbar` para móvil. 3) Composer → `pb-safe` para safe area PWA. 4) Header → `px-4 md:px-6 py-3 md:py-4` compacto en móvil. `flex-shrink-0` en header, toolbar y composer. |
| `apps/web/src/components/ChatList.tsx` | Sin cambios — ya usa `w-full h-full flex flex-col` correctamente. |

## Criterios de Aceptación cubiertos

- **CA-1**: Sin scroll horizontal implementado (overflow-x hidden en globals + flex-shrink-0)
- **CA-3**: Lista y conversación funcionan como vistas independientes en móvil (no requieren resize)
- **CA-4**: Composer tiene `pb-safe` para respeto de safe area; `h-[100dvh]` en layout evita ocultamiento
- **CA-5**: Notas disponibles como bottom sheet (65vh) sin tapar el chat activo
- **CA-6**: Solo un ChatWindow montado simultáneamente (no duplicación de listeners)
- **CA-9**: Split view desktop preservado intacto

## Decisiones de implementación

1. **Panel único en móvil via `isMobile` state** (no CSS-only): La razón es evitar que dos instancias de `ChatWindow` o `ChatList` estén montadas simultáneamente, lo que podría duplicar listeners de Firestore. El `isMobile` state se actualiza en resize.
2. **Notes panel `fixed` en móvil**: Como el contenedor `ChatWindow` no tiene `transform` aplicado, `position: fixed` se ancla al viewport correctamente como bottom sheet.
3. **Bottom sheet notes `h-[65vh]`**: Deja visible el 35% superior para contexto. El usuario puede ver el contacto y el historial reciente.
4. **Toolbar `overflow-x-auto no-scrollbar`**: Preserva todas las acciones sin que los botones se romplan en múltiples líneas o se corten.

## Limitaciones documentadas

- **Build/test no ejecutable**: Mismo entorno que Sprint 1.
- **Quick replies panel**: La grilla de 2 columnas en móvil puede ser estrecha. No se cambió en este sprint (es una mejora estética, no funcional).
- **Teclado virtual en Android**: El `100dvh` + `pb-safe` mejoran la situación pero la experiencia exacta depende del browser. Requiere validación en dispositivo real.

## Estado Soft Gates

| Gate | Estado | Detalle |
|------|--------|---------|
| Gate 1: Compilación | ⚠️ No verificable | Sin runtime |
| Gate 2: Testing | ⚠️ No ejecutable | Sin runner |
| Gate 3: Revisión | ✅ Revisado | Lógica de componentes verificada manualmente |
| Gate 4: Documentación | ✅ | Este checkpoint |

## Siguiente paso

Sprint 3: Admin crítico responsive (products + agents)
