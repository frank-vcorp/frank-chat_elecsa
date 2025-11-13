# SPEC-TESTING

## Objetivo
Establecer una estrategia de testing integral para garantizar la calidad, estabilidad y mantenibilidad del código en Farianergy App.

## Contexto
Actualmente el proyecto carece de tests automatizados. Para garantizar entregas de calidad y evitar regresiones, es necesario implementar:
- Unit tests para lógica de negocio
- Integration tests para API routes
- E2E tests para flujos críticos de usuario
- Configuración de CI/CD para ejecutar tests automáticamente

## Alcance

### Incluye
- Configuración de Vitest (unit + integration tests)
- Configuración de Playwright (E2E tests)
- Tests para packages/core (business logic)
- Tests para API routes (apps/web/src/app/api)
- Tests E2E para flujos críticos (login, CRUD de clientes, rentas)
- Integración con GitHub Actions

### No Incluye (Out of Scope)
- Performance/load testing (fuera de alcance MVP)
- Visual regression testing (considerar en futuras iteraciones)
- Mobile testing (se abordará en sprint dedicado a mobile)

## Requerimientos Funcionales
1. **RF-1:** Unit tests deben cubrir al menos 80% de la lógica en packages/core
2. **RF-2:** Cada API route debe tener integration tests (happy path + error cases)
3. **RF-3:** E2E tests deben cubrir flujos críticos: login, CRUD clientes, creación de rentas
4. **RF-4:** Tests deben ejecutarse en pre-commit hook y en CI

## Requerimientos No Funcionales
- **Performance:** Suite de tests debe ejecutarse en menos de 2 minutos
- **Seguridad:** Tests no deben exponer credenciales reales (usar mocks/emulators)
- **Accesibilidad:** E2E tests deben validar accesibilidad básica (aria-labels, roles)
- **Compatibilidad:** Tests deben correr en entornos Linux, macOS y Windows

## Criterios de Aceptación
- [ ] CA-1: Vitest configurado en packages/core y apps/web
- [ ] CA-2: Playwright configurado en apps/web
- [ ] CA-3: Coverage de 80%+ en packages/core
- [ ] CA-4: Todos los API routes tienen tests de integración
- [ ] CA-5: E2E tests para login, CRUD clientes, creación de rentas
- [ ] CA-6: GitHub Actions workflow ejecuta tests en cada PR
- [ ] CA-7: Pre-commit hook configurado con husky/lint-staged
- [ ] CA-8: Documentación de cómo ejecutar tests localmente

## Dependencias
- **Tareas previas:** Ninguna (puede ejecutarse en paralelo)
- **Recursos externos:** Firebase Emulators (Firestore, Auth)
- **Datos necesarios:** Datos de prueba (fixtures) para tests

## Riesgos Identificados
1. **Flaky tests en E2E:** Mitigación - Usar esperas explícitas, evitar sleeps arbitrarios
2. **Tests lentos afectan DX:** Mitigación - Paralelización, solo smoke tests en pre-commit
3. **Firebase Emulators no disponibles en CI:** Mitigación - Documentar instalación, cachear en CI

## Plan de Implementación

### Fase 1: Configuración de Vitest
- Instalar vitest, @vitest/ui
- Crear vitest.config.ts en packages/core y apps/web
- Configurar coverage (v8 o istanbul)
- Crear script "test" en package.json

### Fase 2: Unit Tests (packages/core)
- Tests para business-logic.ts (cálculo de deudas, validaciones)
- Tests para types.ts (validación de interfaces si aplica)
- Mocks de Firestore SDK

### Fase 3: Integration Tests (API routes)
- Instalar @firebase/testing o usar Firebase Emulators
- Tests para cada route (GET, POST, PUT, DELETE)
- Validar autenticación, autorización, errores

### Fase 4: E2E Tests (Playwright)
- Instalar @playwright/test
- Crear tests/e2e/ directory
- Tests: login.spec.ts, clientes.spec.ts, rentas.spec.ts
- Configurar baseURL, headless mode, screenshots on failure

### Fase 5: CI/CD Integration
- Crear .github/workflows/test.yml
- Jobs: lint, unit tests, integration tests, e2e tests
- Cachear node_modules y playwright browsers
- Require status checks en PRs

### Fase 6: Pre-commit Hooks
- Instalar husky + lint-staged
- Hook: lint + unit tests (solo archivos staged)
- Documentar cómo bypasear si necesario (--no-verify)

## Testing
- **Unit Tests:** Los propios tests unitarios (meta!)
- **Integration Tests:** Validar que integration tests funcionen con emulators
- **E2E Tests:** Smoke test de que Playwright puede iniciar browser
- **Manual QA:** Ejecutar suite completa en máquinas de desarrolladores

## Documentación a Actualizar
- [ ] README.md (sección de testing)
- [ ] CONTRIBUTING.md (si existe, o crear)
- [ ] dossier_tecnico.md (estrategia de testing)
- [ ] AGENTS.md (actualizar instrucciones de testing)

## Estimación
- **Esfuerzo:** 12-16 horas
- **Complejidad:** Alta
- **Prioridad:** Alta

## Notas Adicionales
- Vitest es compatible con API de Jest, facilita migración futura si necesario
- Playwright elegido sobre Cypress por mejor soporte de monorepos y performance
- Considerar mutation testing en futuro (Stryker)
- Firebase Emulators permiten tests sin costos de Firebase

---

**Creado por:** CODEX  
**Fecha:** 2025-11-07  
**Estado:** Pendiente  
**Asignado a:** SOFIA (implementación) + GEMINI (revisión)
