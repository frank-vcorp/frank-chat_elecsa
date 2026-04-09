# SPEC-ARCH-20260409-02

## Objetivo

Rediseñar la UI autenticada de Frank Chat para que funcione como una experiencia responsive integral, con base mobile-first y PWA-first, pero con operación plenamente optimizada tanto en teléfonos y tablets como en PC de escritorio.

## Contexto

La aplicación ya opera como PWA con `display: standalone`, `start_url: /dashboard` y `orientation: portrait`, pero la interfaz autenticada actual fue construida con una lógica principalmente de escritorio. El dashboard depende de split view con resize por mouse, sidebars persistentes, overlays absolutos y anchos fijos. Eso compromete la experiencia móvil, especialmente en una app instalada desde home screen.

La revisión arquitectónica detectó que la deuda no es cosmética sino estructural: navegación, jerarquía, ergonomía táctil, safe areas, convivencia con teclado virtual, productividad en escritorio y consistencia entre dashboard y admin.

La estrategia correcta no es elegir entre móvil o PC, sino definir una base responsive sólida donde móvil sea la base de diseño y escritorio la mejora progresiva de alta productividad. En este producto ambos contextos son críticos: movilidad para operación PWA y escritorio para atención intensiva, multitarea y administración prolongada.

## Interconsultas consideradas

- Deby: [context/interconsultas/DICTAMEN_FIX-20260409-01.md](context/interconsultas/DICTAMEN_FIX-20260409-01.md)
- Gemini: dictamen de QA/PWA emitido en la sesión ARCH-20260409-02

## Alcance

### Incluye

- Redefinir el shell autenticado del dashboard con enfoque mobile-first.
- Optimizar explícitamente la experiencia de escritorio para agentes que trabajan jornadas completas desde PC.
- Sustituir patrones desktop-only por navegación adaptativa para móvil, tablet y escritorio.
- Rediseñar el flujo lista de conversaciones ↔ conversación activa ↔ acciones contextuales.
- Adaptar la UI admin crítica a un shell responsive coherente con el dashboard.
- Definir base visual compartida para PWA: espaciado, tipografía, safe areas y densidad táctil.
- Mantener las funcionalidades actuales: filtros, notas, plantillas, adjuntos, asignación humana/IA, cierre y reapertura.
- Preservar la experiencia PWA instalada en portrait y standalone.

### No Incluye (Out of Scope)

- Reescritura del modelo de datos de Firestore.
- Cambios de seguridad o autenticación.
- Nueva lógica de negocio para routing, agentes o catálogo.
- Rediseño visual del login salvo ajustes menores de consistencia.
- Implementación de modo offline transaccional completo con cola persistente, salvo preparación arquitectónica.

## Límites de Intervención

### Permitido

- Cambios de layout, espaciado, tipografía, jerarquía visual, breakpoints y navegación visual.
- Reorganización de componentes para resolver responsive, densidad, safe areas y ergonomía táctil.
- Ajustes de estado estrictamente visual para abrir/cerrar paneles, drawers, tabs, sheets o vistas equivalentes.
- Refactor menor de composición de componentes si es necesario para separar shell, paneles y zonas visuales.

### Prohibido

- Cambiar reglas de negocio, routing funcional o decisiones operativas del chat.
- Alterar contratos de API, payloads o comportamiento de endpoints.
- Modificar autenticación, permisos, roles, sucursales o reglas de seguridad.
- Cambiar consultas Firestore por razones de negocio o seguridad, salvo que sea imprescindible para evitar una regresión visual directa y quede expresamente justificado.
- Cambiar la lógica de asignación IA/humano, cierre, reapertura, etiquetado, notas, plantillas o adjuntos fuera de su presentación visual.

## Principio Rector de Ejecución

Esta iniciativa es de UI y experiencia responsive. La meta es mejorar presentación, navegación y ergonomía sin tocar negocio. Si durante la implementación aparece una mejora que implique cambiar lógica funcional, debe quedar fuera de este alcance y tratarse como tarea separada.

## Rutas y archivos objetivo

- [apps/web/src/app/globals.css](apps/web/src/app/globals.css)
- [apps/web/src/app/dashboard/layout.tsx](apps/web/src/app/dashboard/layout.tsx)
- [apps/web/src/app/dashboard/page.tsx](apps/web/src/app/dashboard/page.tsx)
- [apps/web/src/components/ChatList.tsx](apps/web/src/components/ChatList.tsx)
- [apps/web/src/components/ChatWindow.tsx](apps/web/src/components/ChatWindow.tsx)
- [apps/web/src/components/StatusBar.tsx](apps/web/src/components/StatusBar.tsx)
- [apps/web/src/app/admin/layout.tsx](apps/web/src/app/admin/layout.tsx)
- [apps/web/src/app/admin/products/page.tsx](apps/web/src/app/admin/products/page.tsx)
- [apps/web/src/app/admin/agents/page.tsx](apps/web/src/app/admin/agents/page.tsx)
- Páginas admin prioritarias adicionales según validación visual posterior

## Requerimientos Funcionales

1. RF-1: En móvil, el dashboard debe operar como flujo de una sola columna, priorizando lista o conversación según contexto, sin depender de resize manual.
2. RF-2: La navegación principal autenticada debe transformarse en patrón mobile-friendly, con acceso claro a Conversaciones, Reportes, Productos, Agentes y Configuración.
3. RF-3: La conversación activa debe conservar todas sus acciones actuales en móvil: enviar mensaje, adjuntar, etiquetar, usar plantillas, tomar conversación, retomar IA, cerrar, reabrir y notas.
4. RF-4: El panel de notas internas no puede bloquear el composer ni ocultar información crítica; en móvil debe convertirse en sheet, vista dedicada o panel apilado.
5. RF-5: El dashboard debe soportar regreso claro desde conversación a lista sin pérdida de contexto del usuario.
6. RF-6: El layout admin debe ser navegable desde móvil sin sidebar fija visible permanentemente.
7. RF-7: La UI debe respetar el contexto PWA instalado: encabezados, navegación y acciones no deben quedar ocultos bajo barras del sistema o notch.
8. RF-8: La experiencia de escritorio debe mantenerse y mejorar explícitamente, usando mejoras progresivas sobre una base mobile-first.
9. RF-9: En escritorio, el dashboard debe poder aprovechar mejor el ancho disponible con una composición orientada a productividad, sin degradar claridad ni densidad operativa.
10. RF-10: La navegación y las acciones frecuentes deben seguir siendo rápidas y visibles para usuarios de PC que trabajan con múltiples conversaciones y módulos administrativos.

## Requerimientos No Funcionales

- Performance: No debe existir scroll horizontal en anchos desde 320 px. Las rutas autenticadas deben mantener navegación percibida fluida y sin saltos visuales notorios al cambiar de breakpoint.
- Accesibilidad: Todos los controles interactivos deben conservar foco visible, tamaños táctiles adecuados y etiquetas comprensibles. El orden de tabulación no debe degradarse al ocultar sidebars o drawers.
- Compatibilidad: La experiencia debe validarse al menos en móvil portrait pequeño, móvil grande, tablet y escritorio.
- Experiencia de uso: La solución debe equilibrar ergonomía táctil en móvil con productividad sostenida en escritorio, evitando que la mejora en un entorno empobrezca al otro.
- PWA: La UI debe comportarse correctamente en modo standalone, incluyendo safe areas, viewport vertical y convivencia con teclado virtual.
- Robustez: No deben duplicarse listeners o side effects por mantener vistas ocultas montadas simultáneamente.
- Mantenibilidad: Debe emerger una base compartida de estilos/responsive tokens para evitar soluciones aisladas por pantalla.

## Criterios de Aceptación

- [ ] CA-1: En 320 px, 360 px y 390 px no existe scroll horizontal en dashboard ni admin principal.
- [ ] CA-2: En móvil, la navegación autenticada es usable con una mano y no requiere sidebar fija visible.
- [ ] CA-3: La lista de conversaciones y la conversación activa funcionan como vistas claras y no dependen de resize con mouse.
- [ ] CA-4: El composer del chat permanece visible y usable con teclado virtual abierto en móvil.
- [ ] CA-5: Notas, etiquetas, plantillas y adjuntos siguen disponibles en móvil sin tapar el área principal de trabajo.
- [ ] CA-6: No hay duplicación perceptible de alertas sonoras o listeners por layouts ocultos o montados en paralelo.
- [ ] CA-7: El shell admin y el shell dashboard comparten una estrategia responsive coherente.
- [ ] CA-8: La app instalada como PWA en portrait conserva navegación, acciones y legibilidad sin recortes por safe area.
- [ ] CA-9: La experiencia de escritorio sigue operativa, conserva paridad funcional y mejora el aprovechamiento del ancho disponible.
- [ ] CA-10: En escritorio amplio, dashboard y admin presentan una disposición de alta productividad sin elementos sobredimensionados ni espacios desperdiciados.
- [ ] CA-11: Se documenta la estrategia responsive/PWA en la documentación del proyecto.

## Dependencias

- Tareas previas: Ninguna obligatoria.
- Recursos externos: Next.js 15, Tailwind CSS, next-pwa, Firebase.
- Datos necesarios: No requiere cambios de credenciales ni estructura de datos.

## Riesgos Identificados

1. Riesgo de pseudo-responsive: intentar parchear la UI actual con clases aisladas sin redefinir shell ni navegación. Mitigación: atacar primero layout base y flujo mobile-first.
2. Riesgo de regresión en tiempo real: overlays, drawers o tabs podrían duplicar listeners y efectos sonoros. Mitigación: asegurar una sola fuente activa de listeners por recurso visible.
3. Riesgo de tapado por teclado virtual: composer y acciones podrían quedar ocultos en PWA instalada. Mitigación: validar con viewport móvil real y safe areas.
4. Riesgo de inconsistencia entre dashboard y admin: resolver una ruta sin un patrón compartido generaría deuda nueva. Mitigación: definir shell y tokens base antes de ajustes puntuales.
5. Riesgo de sobrealcance: intentar rediseñar todas las páginas admin en un solo sprint. Mitigación: priorizar shell + rutas críticas y dejar el resto en una segunda ola controlada.

## Plan de Implementación

### Fase 1: Fundaciones Mobile-First

- Definir estrategia de shell autenticado responsive.
- Establecer tokens base de espaciado, densidad, tipografía y safe areas.
- Eliminar dependencias explícitas de anchos fijos y resize por mouse como base del flujo.

### Fase 2: Dashboard Conversacional

- Convertir lista y conversación a flujo adaptativo por breakpoint.
- Reubicar acciones secundarias a patrones compatibles con móvil.
- Adaptar notas internas, filtros y toolbar de conversación.

### Fase 3: Shell Administrativo

- Unificar navegación admin con patrón responsive coherente.
- Corregir densidad, paddings y estructuras de listado para móvil.
- Priorizar Productos y Agentes como rutas administrativas críticas.

### Fase 4: Validación PWA y QA

- Validar instalación PWA, portrait y standalone.
- Ejecutar revisión visual multi-breakpoint.
- Corregir regresiones de accesibilidad, performance percibida y ergonomía táctil.

## Testing

- Unit Tests: validar helpers o estados UI extraídos si se introducen nuevos utilitarios de layout.
- Integration Tests: navegación entre lista y conversación, preservación de acciones del chat, apertura/cierre de paneles móviles.
- Manual QA:
  - Validar dashboard en 320 px, 360 px, 390 px, 768 px y escritorio.
  - Validar PWA instalada en portrait con navegación completa.
  - Validar teclado virtual sobre composer.
  - Validar notas, etiquetas, adjuntos, plantillas, cerrar, reabrir, tomar conversación y retomar IA.
  - Validar shell admin, especialmente Productos y Agentes.

## Documentación a Actualizar

- [ ] [docs/CHAT_DASHBOARD.md](docs/CHAT_DASHBOARD.md)
- [ ] [README.md](README.md)
- [ ] Documento de checkpoint al cierre de implementación

## Estimación

- Esfuerzo: 2 micro-sprints.
- Complejidad: Alta.
- Prioridad: Crítica.

## Micro-Sprint Propuesto

## 📋 MICRO-SPRINT: Shell Responsive PWA Autenticado
**Fecha:** 2026-04-09  
**Proyecto:** Frank Chat ELECSA  
**Duración estimada:** 2-4 horas por fase inicial  

### 🎯 Entregable Demostrable
> El usuario puede abrir la PWA en móvil, navegar entre lista de conversaciones, conversación activa y menú principal sin scroll horizontal ni elementos tapados.

### ✅ Tareas Técnicas
- [ ] (3) Rehacer shell autenticado mobile-first para dashboard y admin
- [ ] (3) Adaptar lista/chat/notas/acciones al flujo táctil responsive
- [ ] (2) Validar PWA portrait, safe areas y teclado virtual

### 🧪 Cómo Demostrar
1. Abrir la PWA instalada o el navegador en ancho móvil.
2. Entrar a dashboard, abrir una conversación y usar acciones principales.
3. Volver a la lista y navegar al admin sin desbordes ni bloqueos visuales.

## Handoff Recomendado

Delegar implementación a SOFIA con foco estricto en:

- mobile-first real, no solo retoques por breakpoint
- paridad funcional entre móvil y escritorio
- validación visual PWA instalada
- revisión final con QA sobre breakpoints y accesibilidad

## Orquestación Autónoma por Agente

### SOFIA - Builder

- Ejecuta toda la implementación visual.
- Prioriza shell compartido, dashboard conversacional y admin responsive.
- No toca negocio ni APIs salvo ajustes técnicos mínimos para sostener navegación visual.
- Debe trabajar por fases pequeñas y cerrar cada una con validación visual antes de continuar.

### Deby

- Entra solo ante bugs de UI, regresiones visuales, overlays rotos, pérdida de estado visual o comportamientos anómalos repetidos.
- No redefine la arquitectura ni absorbe trabajo de implementación normal.
- Si detecta que el problema es de lógica de negocio, lo deja fuera de esta SPEC.

### Gemini

- Audita calidad responsive, accesibilidad, consistencia entre breakpoints y comportamiento PWA.
- Valida que escritorio no quede empobrecido por optimizar móvil.
- Revisa criterios de aceptación, densidad operativa, safe areas y riesgo de regresiones.

## Secuencia Operativa Recomendada

1. SOFIA implementa shell responsive base sin tocar funcionalidad.
2. GEMINI audita shell y devuelve hallazgos antes de expandir cambios.
3. SOFIA adapta dashboard conversacional y acciones secundarias.
4. DEBY solo entra si aparece una regresión repetida o un comportamiento UI ambiguo.
5. SOFIA adapta admin crítico con el mismo patrón responsive.
6. GEMINI ejecuta auditoría final contra criterios de aceptación.

---

**Creado por:** INTEGRA  
**Fecha:** 2026-04-09  
**Estado:** Planificado  
**Asignado a:** SOFIA - Builder