# Criterios de Calidad del Proyecto

Este documento define los estándares de calidad que deben cumplirse antes de considerar cualquier entregable como completo.

## I. Calidad de Código

### Estándares de Escritura
- [ ] Código sigue convenciones de `meta/SPEC-CODIGO.md`
- [ ] Nombres descriptivos y consistentes (variables, funciones, clases)
- [ ] Sin código muerto o comentarios obsoletos
- [ ] Sin `console.log()` en producción (usar logger apropiado)
- [ ] Sin warnings de ESLint o TypeScript

### Tipado TypeScript
- [ ] Tipos explícitos en APIs públicas
- [ ] Cero errores de compilación TypeScript
- [ ] Uso mínimo de `any` (solo casos excepcionales documentados)
- [ ] Interfaces y types reutilizables en `types.ts` o `@/types`

### Organización
- [ ] Archivos en carpetas lógicas según responsabilidad
- [ ] Imports organizados (externos → internos → relativos)
- [ ] Separación de concerns (UI, lógica de negocio, data access)
- [ ] Módulos no exceden 300 líneas (refactorizar si es necesario)

## II. Testing

### Cobertura
- [ ] Lógica de negocio: 80%+ coverage
- [ ] API Routes: 70%+ coverage
- [ ] Componentes UI: 60%+ coverage (foco en lógica)

### Tipos de Tests
- [ ] **Unit Tests:** Funciones puras, utils, business logic
- [ ] **Integration Tests:** API routes, database operations
- [ ] **E2E Tests:** Flujos críticos de usuario (login, CRUD principales)

### Calidad de Tests
- [ ] Tests son determinísticos (no flaky)
- [ ] Nombres descriptivos (formato: "should ... when ...")
- [ ] Usan fixtures/mocks apropiados (no datos reales)
- [ ] No dependen del orden de ejecución
- [ ] Se ejecutan en menos de 2 minutos (suite completa)

## III. Seguridad

### Autenticación y Autorización
- [ ] Todos los API routes validan autenticación
- [ ] Firestore Rules implementadas para todas las colecciones
- [ ] Roles de usuario verificados en operaciones sensibles
- [ ] Tokens JWT validados en server-side

### Gestión de Secretos
- [ ] Cero credenciales hardcodeadas
- [ ] Variables de entorno en `.env.local` (nunca en `.env`)
- [ ] `.env.local` en `.gitignore` y `.aiexclude`
- [ ] `.env.example` actualizado (sin valores reales)

### Validación de Inputs
- [ ] Inputs de usuario validados con zod o similar
- [ ] Sanitización de campos de texto libre
- [ ] Protección contra XSS en campos user-generated
- [ ] Rate limiting en endpoints públicos (si aplica)

### Auditoría
- [ ] `pnpm audit` sin vulnerabilidades críticas o altas
- [ ] Dependencias actualizadas a versiones estables
- [ ] Headers de seguridad configurados (CSP, X-Frame-Options, etc.)

## IV. Performance

### Frontend
- [ ] Lighthouse Score: Performance > 85
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Time to Interactive (TTI) < 3.8s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Lazy loading de componentes pesados
- [ ] Imágenes optimizadas (WebP, tamaños responsivos)

### Backend
- [ ] API responses < 200ms (p95)
- [ ] Firestore queries optimizadas (índices, limits)
- [ ] Paginación en listas largas (> 50 items)
- [ ] Caché implementado donde aplica (React Query, SWR)

### Bundle Size
- [ ] JavaScript bundle < 200KB (gzipped)
- [ ] Code splitting implementado
- [ ] Tree shaking habilitado
- [ ] Dependencias revisadas (evitar libs pesadas innecesarias)

## V. Accesibilidad

### WCAG 2.1 Nivel AA
- [ ] Contraste de colores >= 4.5:1 (texto normal)
- [ ] Navegación por teclado funcional
- [ ] Focus indicators visibles
- [ ] Roles ARIA cuando HTML semántico no es suficiente

### Screen Readers
- [ ] Labels en todos los inputs
- [ ] Alt text en imágenes (o vacío si decorativas)
- [ ] Mensajes de error asociados con `aria-describedby`
- [ ] Landmark regions (`<nav>`, `<main>`, `<aside>`)

### Testing
- [ ] Lighthouse Score: Accessibility > 90
- [ ] Prueba manual con lector de pantalla (NVDA o VoiceOver)
- [ ] Prueba de navegación solo con teclado

## VI. UX y Usabilidad

### Estados de UI
- [ ] Loading states en operaciones async
- [ ] Error states con mensajes claros
- [ ] Empty states informativos
- [ ] Success feedback visual (toast, modal, etc.)

### Responsive Design
- [ ] Funcional en móvil (320px+)
- [ ] Funcional en tablet (768px+)
- [ ] Funcional en desktop (1024px+)
- [ ] Touch targets >= 44x44px en móvil

### Interacción
- [ ] Formularios con validación en tiempo real
- [ ] Confirmación para acciones destructivas
- [ ] Breadcrumbs o navegación clara
- [ ] Tiempo de respuesta percibido < 1s

## VII. Documentación

### Código
- [ ] Comentarios en decisiones no obvias (ver SPEC-CODIGO.md §III)
- [ ] JSDoc en funciones públicas complejas
- [ ] README.md actualizado en cada módulo/package

### Proyecto
- [ ] `PROYECTO.md` refleja estado actual
- [ ] `dossier_tecnico.md` documenta decisiones arquitectónicas
- [ ] SPECs creados para tareas complejas (>4h)
- [ ] Checkpoints al final de cada sprint

### APIs
- [ ] Endpoints documentados (tipo, parámetros, respuestas)
- [ ] Ejemplos de requests/responses
- [ ] Códigos de error documentados
- [ ] Rate limits y cuotas especificados

## VIII. DevOps y CI/CD

### Control de Versiones
- [ ] Commits siguen Conventional Commits (ver SPEC-CODIGO.md §VIII)
- [ ] Branches descriptivos (`feat/user-auth`, `fix/payment-bug`)
- [ ] Pull Requests con descripción y tests

### CI/CD
- [ ] Tests se ejecutan en CI (GitHub Actions, etc.)
- [ ] Lint y type-check en pre-commit hook
- [ ] Build exitoso antes de merge
- [ ] Deploy automático a preview environment (si aplica)

### Monitoreo
- [ ] Logging de errores (console.error en dev, servicio en prod)
- [ ] Métricas básicas (uptime, latencia)
- [ ] Alertas configuradas para errores críticos
- [ ] Rollback plan documentado

## IX. Compatibilidad

### Navegadores
- [ ] Chrome/Edge (últimas 2 versiones)
- [ ] Firefox (últimas 2 versiones)
- [ ] Safari (últimas 2 versiones)
- [ ] Degradación graceful en navegadores antiguos

### Plataformas
- [ ] Web: Next.js en Vercel/similar
- [ ] Mobile: React Native en Android 8+ e iOS 13+
- [ ] Offline support (si aplica)

## X. Proceso de Revisión

### Checklist de Pre-Merge
Antes de marcar una tarea como `[✓]` en PROYECTO.md:

1. **Auto-Revisión (Autor)**
   - [ ] Ejecutar `pnpm lint` sin errores
   - [ ] Ejecutar `pnpm test` todos los tests pasan
   - [ ] Ejecutar `pnpm build` sin errores
   - [ ] Revisar diff en Git (eliminar debug code)

2. **Code Review (GEMINI o Peer)**
   - [ ] Código cumple SPEC-CODIGO.md
   - [ ] Tests cubren casos edge
   - [ ] Seguridad: inputs validados, auth verificada
   - [ ] Performance: queries optimizadas, bundle size OK

3. **QA Manual (SOFIA o QA)**
   - [ ] Happy path funcional
   - [ ] Error handling funcional
   - [ ] UI responsive
   - [ ] Accesibilidad básica (keyboard nav)

4. **Aprobación Final (FRANK)**
   - [ ] Cumple criterios de aceptación del SPEC
   - [ ] Documentación actualizada
   - [ ] Sin blockers o deuda técnica crítica
   - [ ] Estado → `[X] Aprobado`

---

**Versión:** 1.0  
**Fecha:** 2025-11-08  
**Autor:** CODEX (Sistema Integra Evolucionada)  
**Revisores:** SOFIA, GEMINI, FRANK

## Changelog

### v1.0 (2025-11-08)
- Versión inicial de criterios de calidad
- 10 categorías: Código, Testing, Seguridad, Performance, Accesibilidad, UX, Documentación, DevOps, Compatibilidad, Proceso
