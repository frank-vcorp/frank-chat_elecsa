# CHK — SPRINT 1: Shell Responsive Compartido
**ID:** IMPL-20260409-01  
**Fecha:** 2026-04-09  
**Agente:** SOFIA - Builder  
**Sprint:** 1/3 — Shell responsive dashboard + admin

---

## Resumen

Primera fase de implementación responsive. Se estableció la base estructural del shell autenticado para móvil y desktop.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/globals.css` | Variables safe-area PWA (`--sat`, `--sab`, `--sal`, `--sar`), overflow-x hidden global, utilidades `.pt-safe`, `.pb-safe`, custom-scrollbar, no-scrollbar |
| `apps/web/src/app/dashboard/layout.tsx` | Sidebar → drawer responsive; estado `mobileMenuOpen`; top bar móvil con hamburguesa; `h-[100dvh]`; overlay backdrop; etiquetas de navegación visibles siempre en móvil |
| `apps/web/src/app/admin/layout.tsx` | Mismo patrón: drawer responsive, top bar móvil, padding `p-4 md:p-8`; reemplazo de `h-screen` por `h-[100dvh]` |

## Criterios de Aceptación cubiertos (total o parcialmente)

- **CA-2** (parcial): Navegación autenticada accesible en móvil via top bar + drawer
- **CA-7** (completo): Dashboard y admin comparten estrategia responsive coherente (misma arquitectura de drawer)
- **CA-8** (parcial): Safe areas aplicadas como variables CSS y clase `pt-[calc(1rem+var(--sat))]` en header del drawer
- **CA-10** (parcial): Desktop mantiene sidebar colapsable para productividad

## Decisiones de implementación

1. **Drawer fijo vs bottom nav**: Se eligió drawer lateral (slide desde la izquierda) por consistencia con el design system existente (sidebar oscura). Bottom nav requeriría rediseñar las rutas de navegación y añadir más complejidad.
2. **`h-[100dvh]` vs `h-screen`**: `100dvh` (dynamic viewport height) maneja correctamente el teclado virtual en móvil y la barra de dirección en browsers móviles.
3. **`mobileMenuOpen` estado local**: Sin persistencia en localStorage para mantener simplicidad. El drawer cierra en cada navegación a nueva ruta (onClick en cada Link).
4. **Sidebar siempre w-64 en móvil**: El drawer siempre muestra el menú expandido. La variable `sidebarOpen` solo controla el desktop.

## Limitaciones documentadas

- **Build/test no ejecutable en este entorno**: No se corrió `npm run build` ni `npm run dev` por ausencia del runtime de Node.js en el devcontainer actual. Los cambios son estructuralmente correctos según la lógica Tailwind CSS responsive.
- **Qodo CLI**: Se intentó verificar disponibilidad. No disponible en el entorno (`qodo` no instalado). Se omite `self-review` de Qodo y se documenta aquí.

## Estado Soft Gates

| Gate | Estado | Detalle |
|------|--------|---------|
| Gate 1: Compilación | ⚠️ No verificable | Sin runtime Node.js en devcontainer |
| Gate 2: Testing | ⚠️ No ejecutable | Sin runner de tests |
| Gate 3: Revisión | ✅ Revisado | Lógica responsive verificada manualmente |
| Gate 4: Documentación | ✅ | Este checkpoint |

## Siguiente paso

Sprint 2: Dashboard conversacional responsive (`dashboard/page.tsx`, `ChatWindow.tsx`, `ChatList.tsx`)
