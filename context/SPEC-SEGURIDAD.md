# SPEC-SEGURIDAD

## Objetivo
Implementar medidas de seguridad críticas para proteger datos sensibles, credenciales y prevenir vulnerabilidades comunes en la aplicación Farienergy.

## Contexto
La aplicación maneja información sensible de clientes, transacciones financieras (pagos), y datos de equipos. Es crítico asegurar que:
- Las credenciales no se expongan en repositorios
- Los datos en tránsito estén protegidos
- El acceso a recursos esté autorizado por roles
- Las reglas de Firestore protejan contra accesos no autorizados

## Alcance

### Incluye
- Configuración de Firestore Security Rules
- Validación de Firebase Auth en API routes
- Sanitización de inputs en formularios
- Implementación de CSP (Content Security Policy)
- Auditoría de dependencias con vulnerabilidades conocidas
- Configuración de CORS apropiada

### No Incluye (Out of Scope)
- Penetration testing externo (se recomienda para producción)
- Certificados SSL (manejados por Vercel/hosting provider)
- WAF (Web Application Firewall) - fuera de alcance MVP

## Requerimientos Funcionales
1. **RF-1:** Todos los API routes deben validar autenticación con Firebase Auth
2. **RF-2:** Firestore Rules deben permitir operaciones solo a usuarios autenticados con roles apropiados
3. **RF-3:** Los inputs de usuario deben ser sanitizados antes de procesarse
4. **RF-4:** Las variables de entorno sensibles deben estar en .env.local (nunca en .env.example)

## Requerimientos No Funcionales
- **Performance:** La validación de auth no debe agregar más de 50ms por request
- **Seguridad:** Cumplir con OWASP Top 10 (al menos A01, A02, A03, A05, A07)
- **Accesibilidad:** N/A
- **Compatibilidad:** Firestore Rules v2

## Criterios de Aceptación
- [ ] CA-1: Firestore Security Rules implementadas para todas las colecciones (clientes, rentas, equipos, cotizaciones, mantenimientos, pagos)
- [ ] CA-2: Middleware de autenticación implementado en API routes
- [ ] CA-3: Validación de inputs con zod o similar en formularios críticos
- [ ] CA-4: CSP headers configurados en next.config.mjs
- [ ] CA-5: Auditoría de dependencias (pnpm audit) sin vulnerabilidades críticas
- [ ] CA-6: .env.local en .gitignore y .aiexclude
- [ ] CA-7: Tests de seguridad básicos (intentos de acceso no autorizado deben fallar)

## Dependencias
- **Tareas previas:** Autenticación implementada (completado)
- **Recursos externos:** Firebase Console access, Firebase Admin SDK
- **Datos necesarios:** Definición de roles de usuario (Admin, Operador, Cliente)

## Riesgos Identificados
1. **Reglas de Firestore demasiado permisivas:** Mitigación - Seguir principio de mínimo privilegio, tests exhaustivos
2. **Bypass de autenticación en client-side:** Mitigación - Validar SIEMPRE en server-side (API routes)
3. **Exposición de secretos en logs:** Mitigación - Sanitizar logs, usar redacción automática

## Plan de Implementación

### Fase 1: Firestore Security Rules
- Crear firestore.rules en raíz del proyecto
- Implementar reglas por colección
- Validar roles (admin vs operador vs cliente)
- Deploy rules a Firebase

### Fase 2: API Route Protection
- Crear middleware de auth en apps/web/src/lib/auth-middleware.ts
- Aplicar a todos los routes en api/*
- Validar tokens JWT de Firebase
- Retornar 401 Unauthorized si falla

### Fase 3: Input Validation
- Instalar zod para validación de esquemas
- Crear schemas en packages/core/src/schemas.ts
- Aplicar validación en formularios y API routes

### Fase 4: Headers y CSP
- Configurar security headers en next.config.mjs
- CSP restrictivo (permitir solo dominios confiables)
- X-Frame-Options, X-Content-Type-Options, etc.

### Fase 5: Auditoría
- Ejecutar pnpm audit
- Revisar dependencias con vulnerabilidades
- Actualizar o reemplazar packages afectados

## Testing
- **Unit Tests:** Validación de reglas de Firestore con emuladores
- **Integration Tests:** Intentos de acceso no autorizado a API routes
- **E2E Tests:** Flujo de login/logout, acceso a recursos protegidos
- **Manual QA:** Verificar que usuarios sin permisos no accedan a datos sensibles

## Documentación a Actualizar
- [ ] dossier_tecnico.md (sección de seguridad)
- [ ] README.md (instrucciones de configuración de .env.local)
- [ ] firestore.rules (comentarios explicativos)

## Estimación
- **Esfuerzo:** 6-8 horas
- **Complejidad:** Media
- **Prioridad:** Crítica

## Notas Adicionales
- Firebase Security Rules tienen su propio lenguaje (CEL - Common Expression Language)
- Considerar uso de Firebase App Check para protección contra abuso
- Evaluar implementación de rate limiting (Firebase Extensions o Cloud Functions)

---

**Creado por:** CODEX  
**Fecha:** 2025-11-07  
**Estado:** Pendiente  
**Asignado a:** SOFIA (implementación) + GEMINI (revisión)
