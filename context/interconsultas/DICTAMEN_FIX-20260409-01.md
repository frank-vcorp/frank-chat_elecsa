# DICTAMEN TÉCNICO: Riesgos arquitectónicos para rehacer la UI autenticada móvil/PWA

- **ID:** FIX-20260409-01
- **Fecha:** 2026-04-09
- **Solicitante:** INTEGRA / Usuario
- **Estado:** ✅ VALIDADO

### A. Análisis de Causa Raíz

El shell autenticado actual está construido con supuestos desktop-first: sidebar persistente y colapsable en [apps/web/src/app/dashboard/layout.tsx](apps/web/src/app/dashboard/layout.tsx), split view con resize solo por mouse en [apps/web/src/app/dashboard/page.tsx](apps/web/src/app/dashboard/page.tsx), panel de notas absoluto dentro del chat en [apps/web/src/components/ChatWindow.tsx](apps/web/src/components/ChatWindow.tsx) y un admin con sidebar fija independiente en [apps/web/src/app/admin/layout.tsx](apps/web/src/app/admin/layout.tsx). Además, la base global de estilos es mínima en [apps/web/src/app/globals.css](apps/web/src/app/globals.css), por lo que hoy no existe un sistema de responsive behavior ni un shell unificado para rutas autenticadas.

En paralelo, el chat en tiempo real depende de múltiples listeners simultáneos: lista de conversaciones en [apps/web/src/components/ChatList.tsx](apps/web/src/components/ChatList.tsx), ventana de chat y notas en [apps/web/src/components/ChatWindow.tsx](apps/web/src/components/ChatWindow.tsx), barra de estado con alertas sonoras en [apps/web/src/components/StatusBar.tsx](apps/web/src/components/StatusBar.tsx). Si la futura UI móvil conserva vistas montadas al mismo tiempo, duplica listeners, sonido y costo de lecturas.

Qodo CLI no estuvo disponible en el entorno durante esta revisión, así que el dictamen se basa en inspección directa del repositorio.

### B. Justificación de la Solución

La SPEC debe tratar la refactorización como rediseño de shell autenticado, no como ajuste cosmético. Prioridades propuestas:

1. **P0 - Riesgos probables en móvil/PWA si se implementa mal**
   - **Layout atrapado o cortado por viewport móvil**: el uso extendido de `h-screen`, áreas `overflow-hidden`, header sticky, footer fijo y panel absoluto puede dejar ocultos el composer, acciones y notas al abrir teclado o en modo standalone PWA.
   - **Interacción rota por patrón desktop-only**: el resize del split view depende de mouse y no tiene equivalente táctil; en móvil debe desaparecer o mutar a navegación por vistas exclusivas, no comprimirse.
   - **Solapamiento de capas**: el panel de notas absoluto y menús flotantes del chat pueden tapar mensajes, inputs o CTAs en anchos pequeños.
   - **PWA rígida y poco tolerante**: [apps/web/public/manifest.json](apps/web/public/manifest.json) fuerza `display: standalone`, `start_url: /dashboard` y `orientation: portrait`; si la SPEC no define fallback de auth, carga y navegación inicial, puede haber flashes, rutas muertas o mala experiencia al abrir instalada.
   - **Accesibilidad degradada**: en [apps/web/src/app/layout.tsx](apps/web/src/app/layout.tsx) el viewport usa `maximumScale: 1`; si se mantiene sin justificación, bloquea zoom y complica uso operativo en campo.

2. **P0 - Conflictos con el chat en tiempo real**
   - **Listeners duplicados**: si móvil muestra lista y chat en drawers, tabs o portales sin desmontar vistas previas, se activarán `onSnapshot` redundantes para conversaciones, mensajes, notas y métricas.
   - **Alertas duplicadas o fuera de contexto**: hoy la notificación visual vive en ChatList y el sonido en StatusBar; una nueva shell que mantenga ambos montados en más de un contenedor puede disparar ruido duplicado o persistente.
   - **Pérdida de estado conversacional**: `selectedConversationId` vive localmente en [apps/web/src/app/dashboard/page.tsx](apps/web/src/app/dashboard/page.tsx); si en móvil se navega entre lista y detalle sin volverlo direccionable o persistente, habrá cierres inesperados, pérdida de borrador y saltos de scroll.
   - **Scroll y foco inestables**: ChatWindow hace `scrollToBottom` tras cada snapshot; si el rediseño cambia mounting/unmounting o introduce animaciones pesadas, puede robar foco al textarea o empujar al usuario al fondo mientras revisa historial.
   - **Notas internas acopladas a visibilidad**: el listener de notas solo vive cuando `showNotes` es `true`; una implementación móvil con sheet persistente o cacheada debe definir si el estado es efímero o persistente para no mostrar datos obsoletos.

3. **P1 - Deudas técnicas que deben quedar explícitas en la SPEC**
   - **Deuda de seguridad y datos**: ChatList descarga todas las conversaciones y filtra en cliente; la propia deuda ya está declarada en [apps/web/src/components/ChatList.tsx](apps/web/src/components/ChatList.tsx). No debe ocultarse dentro del rediseño.
   - **Shell autenticado duplicado**: dashboard y admin tienen layouts distintos y sidebars distintas; la SPEC debe decidir si habrá un solo app shell autenticado o dos shells con contrato común.
   - **Navegación no direccionable**: la conversación activa no está representada en URL. En móvil esto se vuelve deuda estructural, no solo UX.
   - **Sin sistema de responsive tokens**: [apps/web/src/app/globals.css](apps/web/src/app/globals.css) no define breakpoints semánticos, alturas seguras, capas ni tokens de spacing del shell.
   - **Permisos/alertas acoplados a componentes visuales**: notificaciones, audio y métricas viven en componentes de presentación; la SPEC debe exigir centralización de side effects.

4. **P0 - Criterios de aceptación críticos para evitar regresiones**
   - **Móvil primero real**: desde 320px no debe existir scroll horizontal ni contenido inaccesible en lista, chat, composer, notas ni acciones de conversación.
   - **Una sola fuente de side effects**: en cualquier breakpoint solo puede existir una instancia activa de alertas sonoras/notificaciones y un único set de listeners por recurso visible.
   - **Navegación resiliente**: abrir/cerrar una conversación en móvil no debe perder selección, borrador, archivo adjunto ni posición de lectura salvo acción explícita del usuario.
   - **Notas usables en móvil**: el panel de notas debe abrirse como vista o sheet dedicada, sin cubrir permanentemente el composer ni los controles de conversación.
   - **Compatibilidad PWA autenticada**: la app instalada debe abrir en un estado válido aunque el usuario no tenga sesión vigente; el flujo de login y retorno a dashboard debe quedar definido y probado.
   - **Paridad funcional desktop/mobile**: tomar conversación, retomar IA, cerrar, reabrir, etiquetar, adjuntar archivos y revisar plantillas deben seguir disponibles sin depender de hover o puntero fino.
   - **Admin sin regresión**: la refactorización del shell autenticado no debe romper permisos ni navegación de administración para supervisor/admin.

### C. Instrucciones de Handoff para INTEGRA

1. Escribir la SPEC como **rediseño de app shell autenticado móvil-first**, no como “hacer responsive el dashboard”.
2. Exigir una decisión explícita sobre **modelo de navegación**: lista/detalle por ruta, tabs o stack; no permitir split view comprimido en móvil.
3. Incluir una sección obligatoria de **gobernanza de listeners y side effects** para realtime, audio, notificaciones y notas.
4. Dejar como aceptación dura que la conversación activa sea **direccionable o persistible** y que el composer sea seguro ante teclado móvil/PWA.
5. Registrar como deuda fuera de scope, pero visible, el filtrado cliente de conversaciones y la falta de centralización del shell autenticado.