# CHK — CIERRE: SPEC-ARCH-20260409-02 UI PWA Mobile-First
**ID:** IMPL-20260409-CIERRE  
**Fecha:** 2026-04-09  
**Agente:** SOFIA - Builder  
**SPEC:** [context/SPECs/SPEC-ARCH-20260409-02-ui-pwa-mobile-first.md](../context/SPECs/SPEC-ARCH-20260409-02-ui-pwa-mobile-first.md)

---

## Resumen ejecutivo

Implementación UI responsive completada en 3 sprints. La app autenticada Frank Chat ahora cuenta con:

- **Shell responsive compartido**: Sidebar convertida en drawer lateral para móvil con overlay backdrop; top bar compacta con hamburguesa en móvil; desktop preserva sidebar colapsable con toggle.
- **Dashboard conversacional**: Single-panel en móvil (lista ↔ chat, nunca simultaneos), botón back claro, split-view con resize solo en desktop.
- **Notes panel**: Bottom sheet a 65vh en móvil, overlay lateral en desktop.
- **Composer**: `pb-safe` para safe-area PWA standalone.
- **Admin responsivo**: Drawer en admin; pages críticas (products, agents) con layouts flex-col en móvil.
- **Safe areas globales**: Variables CSS `--sat`, `--sab`, `--sal`, `--sar` y utilidades `.pb-safe` etc. en globals.css.
- **Sin scroll horizontal**: `overflow-x: hidden` global.

## Archivos modificados (7 archivos)

| Archivo | Sprint |
|---------|--------|
| `apps/web/src/app/globals.css` | 1 |
| `apps/web/src/app/dashboard/layout.tsx` | 1 |
| `apps/web/src/app/admin/layout.tsx` | 1 |
| `apps/web/src/app/dashboard/page.tsx` | 2 |
| `apps/web/src/components/ChatWindow.tsx` | 2 |
| `apps/web/src/app/admin/agents/page.tsx` | 3 |
| `apps/web/src/app/admin/products/page.tsx` | 3 |

**Archivos NO modificados** (sin necesidad de cambios): `ChatList.tsx`, `StatusBar.tsx`, demás páginas admin.

## Checkpoints creados

1. `Checkpoints/CHK_2026-04-09_SPRINT1_SHELL.md`
2. `Checkpoints/CHK_2026-04-09_SPRINT2_DASHBOARD.md`
3. `Checkpoints/CHK_2026-04-09_SPRINT3_ADMIN.md`
4. `Checkpoints/CHK_2026-04-09_CIERRE.md` (este archivo)

## Criterios de Aceptación — Estado final

| CA | Descripción | Estado |
|----|-------------|--------|
| CA-1 | Sin scroll horizontal 320-390px | ✅ Implementado (overflow-x hidden global) |
| CA-2 | Navegación usable con una mano en móvil | ✅ Drawer + top bar hamburguesa |
| CA-3 | Lista/conversación sin resize forzoso | ✅ Single-panel móvil |
| CA-4 | Composer visible con teclado virtual | ✅ h-[100dvh] + pb-safe |
| CA-5 | Notas disponibles en móvil sin tapar chat | ✅ Bottom sheet 65vh |
| CA-6 | Sin duplicación de listeners | ✅ Single-panel: solo 1 ChatWindow activo |
| CA-7 | Shell admin y dashboard coherentes | ✅ Mismo patrón drawer/layout |
| CA-8 | PWA portrait: safe areas respetadas | ✅ CSS vars + pt-[calc] en drawer |
| CA-9 | Escritorio funcional con paridad | ✅ Split-view desktop preservado |
| CA-10 | Desktop: alta productividad | ✅ Sidebar colapsable + split view |
| CA-11 | Documentación estrategia responsive | ✅ Este checkpoint + globals.css comentado |

## Riesgos residuales para auditoría Gemini

1. **Validación visual real**: Ningún cambio fue testeado en browser real (360px, 390px, tablet). Auditoría debe validar especialmente:
   - Drawer móvil: apertura/cierre en touch
   - Notes bottom sheet: interacción táctil, scroll interno
   - Composer con keboard virtual en PWA instalada (Android/iOS)
   - Admin agents: scroll de lista limitada a max-h-72 en móvil (podría necesitar ajuste)

2. **`h-[100dvh]` vs `h-screen`**: En algunos browsers/PWA el `dvh` puede no estar soportado. Fallback natural es `100vh`. Si hay problemas en iOS <16, puede necesitar ajuste.

3. **Fixed notes panel**: El `position: fixed` del notes bottom sheet funciona correctamente solo si ningún ancestor de ChatWindow tiene `transform`, `filter` o `perspective`. Actualmente ninguno tiene. Si en el futuro se agregan animaciones de transición con transform al contenedor, puede romperse.

4. **Resize en tablet**: La detección de `isMobile` usa `window.innerWidth < 768`. En tablets en portrait (<768px) mostrarán single-panel, en landscape (>768px) split view. Esto es correcto per SPEC pero requiere validación en tablet real.

5. **Admin agents `max-h-72`**: La lista de agentes en móvil tiene altura máxima de 72 (288px). Si hay muchos agentes, el usuario necesita scrollear antes de ver el panel de detalles. Podría necesitar ajuste a `max-h-48` o similar según el dispositivo.

## Interconsultas

- No se requirió interconsulta con Deby (no se encontraron bugs repetidos durante la implementación).
- Qodo CLI: No disponible en el entorno.

## Auditoría Gemini y ajustes posteriores

- **Veredicto Gemini:** Apto con observaciones.
- **Hallazgos relevantes atendidos antes del cierre:**
   - Se agregó fallback `h-screen` junto con `h-[100dvh]` en los shells de dashboard y admin para mejorar compatibilidad con browsers sin soporte pleno de `dvh`.
   - Se redujo la altura máxima de la lista de agentes en móvil de `max-h-72` a `max-h-56` para mejorar usabilidad en pantallas pequeñas.
- **Observaciones no bloqueantes que permanecen como riesgo residual:**
   - La validación real en dispositivo sigue pendiente.
   - La lógica `window.innerWidth < 768` en dashboard puede revisarse a futuro si aparecen edge cases de resize.
   - La toolbar horizontal del chat es funcional, pero podría refinarse en una iteración posterior.

## Notas finales

- Alcance respetado: solo UI, responsive y ergonomía visual.
- No se modificó lógica de negocio, contratos de API, autenticación, permisos ni reglas operativas.
- El árbol contiene un `.devcontainer/` no relacionado que quedó fuera del commit final.

## Instrucciones para Gemini (auditoría)

1. Verificar visualmente en Chrome DevTools con viewport 360px y 768px
2. Validar que el drawer del dashboard se abre/cierra correctamente en simulated touch
3. Check: en 360px, abrir conversación → aparece back button; volver → regresa a lista
4. Check: abrir notas en chat → aparece bottom sheet sin tapar el composer
5. Check: admin/agents en móvil → lista colapsa a max-h-72 con scroll interno, detalles debajo
6. Check: no hay scroll horizontal en ninguna ruta autenticada
7. Verificar que en desktop el comportamiento split-view + sidebar toggle está intacto
