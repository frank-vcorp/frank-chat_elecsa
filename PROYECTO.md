# PROYECTO: Frank Chat (Cliente: Frank Saavedra)

## Flujo de estados
- [ ] Pendiente
- [/] En Progreso
- [✓] Hecho
- [X] Aprobado

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

## Notas y Referencias
- [Walkthrough](file:///home/frank/.gemini/antigravity/brain/d6b92051-db0c-4877-b893-cba9bed684ec/walkthrough.md)
