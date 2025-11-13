# Sistema de Versionado Semántico - Metodología INTEGRA

## 🎯 Objetivo

Establecer un sistema consistente de versionado para el proyecto Farianergy App que comunique claramente el tipo y magnitud de cambios en cada release.

---

## 📊 Formato de Versión

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

Ejemplo: 2.3.1-beta.1+20251108
```

### Componentes

- **MAJOR:** Cambios incompatibles con versiones anteriores (breaking changes)
- **MINOR:** Nueva funcionalidad compatible con versiones anteriores
- **PATCH:** Correcciones de bugs compatibles con versiones anteriores
- **PRERELEASE (opcional):** Versión preliminar (alpha, beta, rc)
- **BUILD (opcional):** Metadata de build (fecha, commit hash)

---

## 🔢 Cuándo Incrementar Cada Número

### MAJOR (X.0.0)

**Incrementar cuando:**
- ❗ Cambios que rompen compatibilidad con versión anterior
- ❗ Cambios en API que requieren modificar código cliente
- ❗ Eliminación de features existentes
- ❗ Cambios en estructura de base de datos no migrables automáticamente
- ❗ Cambios en autenticación/autorización que afectan usuarios existentes

**Ejemplos:**
```
1.5.3 → 2.0.0
- Migración de Firebase Auth a sistema custom
- Cambio de estructura de collections en Firestore
- Eliminación de API v1 (solo v2 disponible)
```

**Reglas:**
- MAJOR = 0 indica desarrollo inicial (0.x.y = API inestable)
- Al incrementar MAJOR, resetear MINOR y PATCH a 0
- Requiere migration guide en docs
- Debe tener periodo de deprecation warnings antes del cambio

---

### MINOR (x.Y.0)

**Incrementar cuando:**
- ✨ Nueva funcionalidad añadida (backward compatible)
- ✨ Mejora significativa de feature existente
- ✨ Nuevos endpoints de API
- ✨ Nuevas páginas o secciones
- 📈 Mejoras de performance notables
- 🔄 Deprecation de features (pero aún funcionan)

**Ejemplos:**
```
1.2.4 → 1.3.0
- Añadido dashboard de reportes
- Nuevo módulo de cotizaciones
- Filtros avanzados en equipos
```

**Reglas:**
- Al incrementar MINOR, resetear PATCH a 0
- MAJOR se mantiene igual
- Features nuevas deben tener tests
- Actualizar documentación con nuevas features

---

### PATCH (x.y.Z)

**Incrementar cuando:**
- 🐛 Bug fixes (corrección de errores)
- 🔧 Ajustes menores de UI/UX
- 📝 Correcciones de texto/traducciones
- 🔒 Security patches
- ⚡ Optimizaciones menores de performance
- 📚 Actualizaciones de documentación
- 🧹 Refactoring interno sin cambio de comportamiento

**Ejemplos:**
```
1.2.4 → 1.2.5
- Corregido cálculo de fechas en rentas
- Fix de validación en formulario de clientes
- Ajuste de color en botón primario
- Actualización de dependencias (security patch)
```

**Reglas:**
- MAJOR y MINOR se mantienen iguales
- Puede hacerse múltiples PATCHes por día si es necesario
- Hotfixes van aquí
- Siempre requiere tests de regresión

---

### PRERELEASE (x.y.z-LABEL.N)

**Labels comunes:**
- `alpha.N` - Primera fase de testing, inestable
- `beta.N` - Testing más amplio, features congeladas
- `rc.N` - Release Candidate, potencialmente final
- `dev.N` - Build de desarrollo (uso interno)

**Ejemplos:**
```
2.0.0-alpha.1   - Primera versión alpha de v2.0.0
2.0.0-alpha.2   - Segunda versión alpha
2.0.0-beta.1    - Primera beta (features complete)
2.0.0-rc.1      - Release candidate 1
2.0.0           - Release final
```

**Cuándo usar:**
- `alpha`: Features en desarrollo, API puede cambiar
- `beta`: Features completas, testing intensivo
- `rc`: Creemos que está listo, última validación
- `dev`: Builds automáticos de CI/CD

**Reglas:**
- Prereleases son anteriores a la versión final
- `1.0.0-alpha < 1.0.0-beta < 1.0.0-rc < 1.0.0`
- No usar en producción (excepto rc en staging)

---

### BUILD METADATA (x.y.z+METADATA)

**Información adicional sin semántica de versión:**
- Fecha: `1.2.3+20251108`
- Commit hash: `1.2.3+g5f3a1b2`
- Build number: `1.2.3+build.456`
- Combinado: `1.2.3+20251108.g5f3a1b2`

**Ejemplos:**
```
1.2.3+20251108              - Build del 8 de noviembre 2025
1.2.3+g5f3a1b2              - Build del commit g5f3a1b2
2.0.0-beta.1+exp.sha.5114f  - Beta con metadata de commit
```

**Reglas:**
- Build metadata NO afecta precedencia de versiones
- `1.0.0+001 == 1.0.0+002` (son la misma versión)
- Útil para debugging y trazabilidad
- Opcional, solo cuando agrega valor

---

## 📝 Template de Changelog

Mantener `CHANGELOG.md` en la raíz del proyecto:

```markdown
# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added
- [Feature nueva en desarrollo pero no released]

### Changed
- [Cambio en feature existente]

### Deprecated
- [Feature que será removida en próximas versiones]

### Removed
- [Feature eliminada]

### Fixed
- [Bug fix]

### Security
- [Security fix]

---

## [1.3.0] - 2025-11-08

### Added
- Dashboard de equipos con filtros avanzados (#45)
- Exportación de reportes a Excel (#52)
- Sistema de notificaciones por email (#67)

### Changed
- Mejorado performance de carga de tabla de rentas (50% más rápido) (#48)
- Actualizada UI de formulario de clientes con mejor validación (#51)

### Fixed
- Corregido cálculo de fechas de vencimiento en rentas (#42)
- Fix de bug en filtro por estado en equipos (#49)

### Security
- Actualizada dependencia `next` a 14.0.4 para fix de CVE-2023-XXXXX (#50)

---

## [1.2.1] - 2025-11-01

### Fixed
- Hotfix: Error en login cuando email contiene mayúsculas (#40)
- Corregido typo en mensaje de error de pagos (#41)

---

## [1.2.0] - 2025-10-28

### Added
- Módulo de mantenimientos programados (#30)
- API endpoints para mantenimientos (GET, POST, PUT, DELETE) (#31)
- UI para gestión de mantenimientos (#32)

### Changed
- Migrado componente de tabla de equipos a Server Component (#35)
- Actualizada documentación de API en README (#36)

### Deprecated
- API endpoint `/api/v1/equipos` será removido en v2.0.0 (usar `/api/equipos`) (#37)

---

## [1.1.0] - 2025-10-15

### Added
- Filtros por fecha en rentas (#20)
- Paginación en tabla de equipos (#22)

### Fixed
- Error en validación de NIF en formulario de clientes (#21)
- Corregido responsive de dashboard en mobile (#23)

---

## [1.0.0] - 2025-10-01

### Added
- Release inicial de producción
- CRUD completo de Clientes
- CRUD completo de Equipos
- CRUD completo de Rentas
- CRUD completo de Pagos
- Autenticación con Firebase Auth
- Dashboard principal con métricas

---

## [0.2.0] - 2025-09-20

### Added
- Beta pública
- Implementado módulo de rentas (#10)
- Implementado módulo de pagos (#12)

### Changed
- Mejorada UI de dashboard (#11)

---

## [0.1.0] - 2025-09-10

### Added
- Alpha inicial
- Setup del proyecto (Next.js + Firebase)
- Módulo de clientes básico (#1)
- Módulo de equipos básico (#2)
- Autenticación básica (#3)

---

[Unreleased]: https://github.com/farianergy/farianergy-app/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/farianergy/farianergy-app/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/farianergy/farianergy-app/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/farianergy/farianergy-app/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/farianergy/farianergy-app/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/farianergy/farianergy-app/compare/v0.2.0...v1.0.0
[0.2.0]: https://github.com/farianergy/farianergy-app/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/farianergy/farianergy-app/releases/tag/v0.1.0
```

---

## 🏷️ Categorías de Cambios

### Added
Nueva funcionalidad añadida al proyecto.

**Ejemplos:**
- Nuevo módulo de cotizaciones
- Nueva página de reportes
- Nuevo endpoint API
- Nuevos tests

### Changed
Cambios en funcionalidad existente (backward compatible).

**Ejemplos:**
- Mejorada performance de carga
- Actualizada UI de formulario
- Refactorizado componente X para mejor reusabilidad

### Deprecated
Funcionalidad que será removida en futuras versiones.

**Ejemplos:**
- API v1 deprecated (usar v2)
- Componente `OldButton` deprecated (usar `Button`)

**Reglas:**
- Indicar cuándo será removida (ej: "será removida en v3.0.0")
- Proveer alternativa clara
- Mantener funcionalidad al menos 1 MINOR version

### Removed
Funcionalidad eliminada (breaking change → MAJOR).

**Ejemplos:**
- Eliminada API v1
- Removido soporte para IE11
- Eliminado módulo legacy de reportes

### Fixed
Corrección de bugs.

**Ejemplos:**
- Corregido error en cálculo de totales
- Fix de bug en validación de formularios
- Solucionado problema de responsive en mobile

### Security
Cambios relacionados con seguridad.

**Ejemplos:**
- Actualizada dependencia con CVE
- Corregida vulnerabilidad XSS
- Mejorada validación de inputs para prevenir SQL injection

---

## 🔄 Ejemplos de Incrementos

### Caso 1: Bug Fix Simple

**Cambio:**
- Corregido typo en mensaje de error

**Incremento:**
```
1.2.3 → 1.2.4
```

**Changelog:**
```markdown
## [1.2.4] - 2025-11-08
### Fixed
- Corregido typo en mensaje de error de login (#123)
```

---

### Caso 2: Nueva Feature

**Cambio:**
- Añadido módulo de cotizaciones completo

**Incremento:**
```
1.2.4 → 1.3.0
```

**Changelog:**
```markdown
## [1.3.0] - 2025-11-08
### Added
- Módulo de cotizaciones con CRUD completo (#124)
- API endpoints para cotizaciones (#125)
- UI para gestión de cotizaciones (#126)
- Tests unitarios e integración para cotizaciones (#127)
```

---

### Caso 3: Breaking Change

**Cambio:**
- Migración de Firestore a PostgreSQL (cambio de API)

**Incremento:**
```
1.3.0 → 2.0.0
```

**Changelog:**
```markdown
## [2.0.0] - 2025-11-08

### BREAKING CHANGES
- Migración de Firestore a PostgreSQL
- API endpoints ahora retornan `camelCase` en lugar de `snake_case`
- Autenticación migrada a JWT (Firebase Auth descontinuado)

### Migration Guide
Ver `docs/MIGRATION_v1_to_v2.md` para guía detallada de migración.

### Added
- Nueva API v2 con mejor performance
- Soporte para transacciones complejas

### Removed
- API v1 (deprecada en v1.5.0)
- Firebase Auth (reemplazada por JWT)
```

---

### Caso 4: Multiple Changes

**Cambios:**
- Nueva feature: Dashboard de reportes
- Bug fix: Error en cálculo de rentas
- Security: Actualización de dependencia

**Incremento:**
```
1.3.0 → 1.4.0  (MINOR por nueva feature)
```

**Changelog:**
```markdown
## [1.4.0] - 2025-11-08

### Added
- Dashboard de reportes con gráficas de rentas y pagos (#130)
- Exportación de reportes a PDF (#131)

### Fixed
- Corregido error en cálculo de totales de rentas (#128)
- Fix de bug en filtro de fechas (#129)

### Security
- Actualizada dependencia `next` a 14.0.4 (CVE-2023-XXXXX) (#132)
```

---

### Caso 5: Prerelease Workflow

**Flujo de desarrollo para v2.0.0:**

```
1.5.3                    # Última versión estable

↓ Empezar desarrollo de v2

2.0.0-alpha.1            # Primera alpha (inestable)
2.0.0-alpha.2            # Segunda alpha (más features)
2.0.0-alpha.3            # Tercera alpha

↓ Features completas, testing

2.0.0-beta.1             # Primera beta (features congeladas)
2.0.0-beta.2             # Segunda beta (bug fixes)

↓ Testing final

2.0.0-rc.1               # Release candidate 1
2.0.0-rc.2               # Release candidate 2 (fix crítico)

↓ Aprobación

2.0.0                    # Release final
```

---

## 📦 Gestión de Versiones en el Proyecto

### package.json

```json
{
  "name": "@farianergy/web",
  "version": "1.3.0",
  "description": "Farianergy Equipment Management System"
}
```

### Git Tags

```bash
# Crear tag para release
git tag -a v1.3.0 -m "Release v1.3.0 - Dashboard de Equipos"
git push origin v1.3.0

# Listar tags
git tag -l

# Ver info de un tag
git show v1.3.0
```

### GitHub Releases

Cada versión debe tener un GitHub Release con:
- Tag correspondiente (v1.3.0)
- Título descriptivo
- Notas del release (copiar de CHANGELOG.md)
- Assets si aplica (builds, instaladores)

---

## 🤖 Automatización

### Script de Bump Version

```bash
# Bump patch (1.2.3 → 1.2.4)
pnpm version patch

# Bump minor (1.2.3 → 1.3.0)
pnpm version minor

# Bump major (1.2.3 → 2.0.0)
pnpm version major

# Prerelease
pnpm version prerelease --preid=beta  # 1.2.3 → 1.2.4-beta.0
```

### Conventional Commits

Usar commits que permitan auto-generar CHANGELOG:

```bash
# Feature → MINOR
git commit -m "feat(equipos): add export to Excel functionality"

# Fix → PATCH
git commit -m "fix(rentas): correct date calculation timezone issue"

# Breaking change → MAJOR
git commit -m "feat(api)!: migrate to REST API v2

BREAKING CHANGE: API v1 endpoints removed"
```

### Prefijos de Commit:

- `feat`: Nueva feature (→ MINOR)
- `fix`: Bug fix (→ PATCH)
- `docs`: Solo documentación
- `style`: Formato, espacios (no cambia código)
- `refactor`: Refactor sin cambio de funcionalidad
- `perf`: Mejora de performance
- `test`: Añadir tests
- `chore`: Cambios en build, deps, etc.
- `!` después del tipo: Breaking change (→ MAJOR)

---

## 📋 Checklist de Release

### Pre-Release

- [ ] Todos los tests pasan (`pnpm test`)
- [ ] Lint sin errores (`pnpm lint`)
- [ ] Build exitoso (`pnpm build`)
- [ ] CHANGELOG.md actualizado
- [ ] Versión bumped en `package.json`
- [ ] Migration guide creado (si MAJOR)
- [ ] Documentación actualizada

### Release

- [ ] Crear tag en git (`git tag -a vX.Y.Z`)
- [ ] Push tag a GitHub (`git push origin vX.Y.Z`)
- [ ] Crear GitHub Release con notas
- [ ] Deployar a producción
- [ ] Actualizar versión en Firebase/entornos
- [ ] Notificar a stakeholders

### Post-Release

- [ ] Validar que deploy funcionó
- [ ] Crear rama `release/vX.Y.Z` si es MAJOR
- [ ] Actualizar versión en docs públicas
- [ ] Crear checkpoint de release
- [ ] Actualizar roadmap en PROYECTO.md

---

## 🎯 Ejemplo del Proyecto Farianergy

### Estado Actual

```json
{
  "version": "0.1.0"
}
```

**Interpretación:**
- MAJOR = 0: Proyecto en desarrollo inicial, API inestable
- MINOR = 1: Primera iteración funcional
- PATCH = 0: Sin hotfixes aún

### Roadmap de Versiones

```
v0.1.0 - Setup inicial + CRUD básico (actual)
v0.2.0 - Módulo de mantenimientos + notificaciones
v0.3.0 - Dashboard de reportes + exportaciones
v0.4.0 - Optimizaciones de performance
v1.0.0 - Release a producción (API estable)
v1.1.0 - Features post-launch
v2.0.0 - Migración a multi-tenant (futuro)
```

### Próximo Release Planeado

```markdown
## [0.2.0] - 2025-11-15 (Planned)

### Added
- Módulo de mantenimientos programados
- Sistema de notificaciones por email
- Filtros avanzados en todas las tablas
- Exportación de datos a Excel

### Changed
- Mejorada performance de carga de datos (caching)
- Actualizada UI de formularios con mejor UX

### Fixed
- Todos los bugs reportados en v0.1.0
```

---

## 📚 Referencias

- [Semantic Versioning 2.0.0](https://semver.org/lang/es/)
- [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
- [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/)

---

**Versión de este Doc:** 1.0.0
**Última Actualización:** 2025-11-08
**Mantenido por:** Metodología INTEGRA
