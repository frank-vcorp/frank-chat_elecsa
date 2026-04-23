# PROYECTO: Frank Chat (Cliente: Frank Saavedra)

## Flujo de estados

- [ ] Pendiente
- [/] En Progreso
- [✓] Hecho
- [x] Aprobado

## Backlog inicial

- [✓] Bootstrap de estructura y artefactos
  - [✓] Configurar Monorepo (Turborepo + pnpm)
  - [✓] Inicializar Next.js app (apps/web)
- [✓] Definición de Esquema de Datos y Lógica de Negocio
  - [✓] Implementar interfaces y tipos de datos (apps/web/src/lib/types.ts)
  - [✓] Definir colecciones de Firestore (agents, contacts, conversations, messages)
- [✓] Implementación del Módulo Principal (Chat)
  - [✓] Desarrollar API Webhook para Twilio (/api/twilio/webhook)
  - [✓] Implementar lógica de Agente IA (OpenAI)
  - [✓] Implementar interfaz de usuario web (Dashboard)
  - [✓] Integrar con Firebase Firestore (Real-time)
- [✓] Autenticación y Autorización
  - [✓] Configurar Firebase Authentication (Client SDK)
  - [✓] Implementar página de Login
- [ ] Despliegue y Validación
  - [ ] Desplegar en Vercel (Backend/Frontend)
  - [ ] Configurar Proxy Inverso en Plesk (Client Domain -> Vercel)
  - [ ] Configurar Webhook en Twilio Console
  - [ ] Pruebas E2E con usuarios reales

## Actualización 2025-11-29 (Fase 2)

- [✓] Implementación de Catálogo Dinámico y Gestión de Agentes
  - [✓] API Routes para Productos y Agentes (CRUD)
  - [✓] Helper `aiProvider` para lógica centralizada de IA
  - [✓] Integración de "Sofía" en Webhook con hand-off inteligente
- [✓] Interfaz de Administración
  - [✓] Página `/admin/products` para gestión de catálogo
  - [✓] Página `/admin/agents` para edición y prueba de prompts
- [✓] Mejoras en UI de Chat
  - [✓] Indicador visual de "Needs Human"
  - [✓] Botón "Take Conversation" para asignación manual

### Artefactos Generados (Metodología Integra)

- [✓] `task.md` - Lista de tareas actualizada
- [✓] `implementation_plan.md` - Plan de implementación Fase 2
- [✓] `walkthrough.md` - Guía de uso actualizada
- [✓] `Checkpoints/CHK_2025-11-29_2200.md` - Checkpoint Fase 2

## Actualización SOFIA (2025-12-04)

- [✓] Implementación de Automatización Faltante
  - [✓] Resumen Automático con IA al cerrar conversación (`/api/conversation/close`)
  - [✓] Endpoint para Cron Job de Cierre Automático (`/api/cron/close-inactive`)
- [✓] Documentación de Pruebas
  - [✓] Crear `TESTING.md` con instrucciones de validación manual

## Actualización SOFIA (2026-01-14) - Integración Catálogo Dinámico

- [✓] Inyección de Catálogo de Productos al Prompt de Sofía
  - [✓] Nueva función `getProductsCatalogText()` en `aiProvider.ts`
  - [✓] Modificar `getSofiaResponse()` para incluir productos activos
  - [✓] Modificar `testAgentWithContext()` para incluir productos en pruebas
  - [✓] Formato: `SKU | Descripción | Precio | Moneda | Proveedor`
- [✓] Checkpoint: `Checkpoints/CHK_2026-01-14_SOFIA_CATALOGO.md`

## Actualización SOFIA (2025-01-15) - Sistema de Routing por Sucursales

- [✓] Routing Automático de Conversaciones por Sucursal
  - [✓] Tipo `BranchId` con 11 sucursales de ELECSA
  - [✓] `detectBranchByCity()` mapea ciudades a sucursales
  - [✓] `handOffToHuman()` ahora asigna sucursal automáticamente
  - [✓] Detección de escalación en webhook (`[SEMÁFORO: ROJO]`)
- [✓] Filtrado de Dashboard por Sucursal
  - [✓] `AuthContext` con información del agente logueado
  - [✓] `ChatList` filtra por `branch` del agente
  - [✓] Supervisores pueden ver todas las sucursales
  - [✓] Badge visual de sucursal en cada conversación
- [✓] API de Agentes con soporte de sucursal
  - [✓] Campo `branch` al crear agentes humanos
- [ ] Pendiente: Crear agente de prueba (Ana Díaz → Querétaro)
- [✓] Checkpoint: `Checkpoints/CHK_2025-01-15_BRANCH_ROUTING.md`

## Actualización ARQUITECTURA (2026-04-09)

- [/] Rediseño UI autenticada mobile-first para PWA
  - [✓] SPEC creada: `context/SPECs/SPEC-ARCH-20260409-02-ui-pwa-mobile-first.md`
  - [/] Implementación UI responsive completada y pendiente de validación visual final en dispositivo/navegador
  - [✓] Interconsultas consideradas: Deby + Gemini
  - [✓] Checkpoints creados: `Checkpoints/CHK_2026-04-09_SPRINT1_SHELL.md`, `Checkpoints/CHK_2026-04-09_SPRINT2_DASHBOARD.md`, `Checkpoints/CHK_2026-04-09_SPRINT3_ADMIN.md`, `Checkpoints/CHK_2026-04-09_CIERRE.md`

- [x] Nombres visibles de conversación (WhatsApp + edición manual)
  - [✓] SPEC creada: `context/SPECs/SPEC-ARCH-20260409-11-conversation-display-name.md`
  - [✓] Fase 1: nombre de WhatsApp visible en UI (webhook guarda `displayName`)
  - [✓] Fase 2: edición manual del nombre desde cabecera del chat (validado en producción 2026-04-23)

- [~] Reconstrucción de Reportes v2
  - [✓] SPEC creada: `context/SPECs/SPEC-ARCH-20260409-15-reportes-v2.md`
  - [✓] Interconsultas consideradas: Deby + Gemini
  - [/] Implementación técnica completada y pendiente de validación runtime final
  - [✓] Checkpoint creado: `Checkpoints/CHK_2026-04-09_IMPL-20260409-02_reportes-v2.md`
  - [✓] Índices documentados: `firestore.indexes.json`

- [~] Dashboard analítico de reportes
  - [✓] SPEC creada: `context/SPECs/SPEC-ARCH-20260410-03-dashboard-analitico-reportes.md`
  - [✓] Interconsultas consideradas: Deby + Gemini
  - [/] Implementación realizada por SOFIA y pendiente de validación visual/runtime
  - [✓] Checkpoint creado: `Checkpoints/CHK_2026-04-10_IMPL-20260410-03_DASHBOARD-ANALITICO-REPORTES.md`

## Actualización INTEGRA / SOFIA (2026-04-22/23) — Fixes Routing + FCM Push

- [✓] Fix routing: SKU con guiones (456-789 ↔ 456789) — `ARCH-20260422-01`
  - [✓] `productSearch.ts`: campo `skuNormalized` en índice MiniSearch + fallback en búsqueda
  - [✓] Commit: `27c34b7`

- [✓] Fix routing: desvío de sucursal cuando ciudad llega tarde — `ARCH-20260422-02`
  - [✓] Early Warning System corre antes del early-return por `!isAssignedToAi`
  - [✓] `handOffToHuman()` ya no se invoca sin ciudad detectada (IA sigue activa)
  - [✓] Commit: `27c34b7`

- [✓] Notificaciones Push FCM a agentes en iPhone/Android — `ARCH-20260423-01`
  - [✓] `public/firebase-messaging-sw.js`: service worker background push
  - [✓] `firebase.ts`: `requestFCMToken()` con VAPID key
  - [✓] `api/notifications/register-token`: endpoint POST autenticado
  - [✓] `settings/page.tsx`: botón "Activar notificaciones en este dispositivo"
  - [✓] `aiProvider.ts`: `handOffToHuman()` envía push FCM a agentes de la sucursal
  - [✓] Commit: `3b0819c`
  - [ ] **Pendiente (manual)**: agregar `NEXT_PUBLIC_FIREBASE_VAPID_KEY` en Vercel env vars

## Notas y Referencias

- [Walkthrough](file:///home/frank/.gemini/antigravity/brain/d6b92051-db0c-4877-b893-cba9bed684ec/walkthrough.md)
