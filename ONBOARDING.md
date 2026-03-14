# Onboarding - Metodología INTEGRA

## 🎉 Bienvenido al Proyecto

Esta guía te ayudará a entender la metodología de trabajo, estructura del proyecto y mejores prácticas. Ya seas un nuevo agente IA (SOFIA, CODEX, GEMINI) o un desarrollador humano, esta es tu primera parada.

---

## 🎯 ¿Qué es la Metodología INTEGRA?

**INTEGRA** es un sistema de documentación y flujo de trabajo diseñado para:

- ✅ **Mantener contexto** entre sesiones de trabajo (especialmente importante para agentes IA)
- ✅ **Facilitar handoffs** entre diferentes agentes o desarrolladores
- ✅ **Documentar decisiones** técnicas para evitar re-debates
- ✅ **Priorizar trabajo** de forma consistente y objetiva
- ✅ **Trackear progreso** con checkpoints enriquecidos

### Principios Fundamentalesrepo

1. **Documentación como código:** La documentación es tan importante como el código
2. **Contexto sobre memoria:** No asumas que el próximo agente recuerda lo anterior
3. **Decisiones documentadas:** Cada decisión técnica importante queda registrada
4. **Progreso visible:** El estado del proyecto es claro en todo momento
5. **Calidad sobre velocidad:** Hacer bien > hacer rápido

---

## 📚 Documentos Esenciales (Orden de Lectura)

### Fase 1: Contexto Inicial (30 minutos)

| Orden | Documento                        | Tiempo | Propósito                           |
| ----- | -------------------------------- | ------ | ----------------------------------- |
| 1️⃣    | `ONBOARDING.md` (este documento) | 10 min | Entender la metodología             |
| 2️⃣    | `PROYECTO.md`                    | 10 min | Estado actual del proyecto y tareas |
| 3️⃣    | `README.md`                      | 5 min  | Setup técnico y comandos básicos    |
| 4️⃣    | `AGENTS.md`                      | 5 min  | Reglas específicas para agentes     |

**Objetivo:** Tener contexto suficiente para empezar a trabajar.

---

### Fase 2: Documentación Técnica (45 minutos)

| Orden | Documento                                | Tiempo | Propósito                            |
| ----- | ---------------------------------------- | ------ | ------------------------------------ |
| 5️⃣    | `context/dossier_tecnico.md`             | 15 min | Arquitectura y decisiones técnicas   |
| 6️⃣    | `context/SPEC-*.md`                      | 15 min | Especificaciones técnicas detalladas |
| 7️⃣    | `Checkpoints/` (últimos 2-3)             | 10 min | Qué se hizo recientemente            |
| 8️⃣    | `metodologia-integra/context/decisions/` | 5 min  | ADRs existentes                      |

**Objetivo:** Entender las decisiones arquitectónicas y contexto técnico.

---

### Fase 3: Metodología Profunda (30 minutos - opcional)

| Orden | Documento                                                      | Tiempo | Propósito                        |
| ----- | -------------------------------------------------------------- | ------ | -------------------------------- |
| 9️⃣    | `metodologia-integra/meta/sistema-priorizacion.md`             | 10 min | Cómo decidir qué trabajar        |
| 🔟    | `metodologia-integra/meta/sistema-handoff.md`                  | 10 min | Cómo pasar trabajo a otro agente |
| 1️⃣1️⃣  | `metodologia-integra/meta/versionado-semantico.md`             | 5 min  | Cómo versionar cambios           |
| 1️⃣2️⃣  | `metodologia-integra/meta/plantilla-checkpoint-enriquecido.md` | 5 min  | Template de checkpoints          |

**Objetivo:** Dominar el flujo de trabajo completo.

---

## 🏗️ Estructura del Proyecto

```
farianergy-app/
├── apps/
│   ├── web/                    # Next.js web app (principal)
│   └── mobile/                 # React Native app (futuro)
│
├── packages/                   # Código compartido (deprecado, migrado a apps/web/src/lib)
│
├── metodologia-integra/        # 🌟 SISTEMA DE DOCUMENTACIÓN
│   ├── meta/                   # Metodología y plantillas
│   │   ├── plantilla-checkpoint-enriquecido.md
│   │   ├── sistema-priorizacion.md
│   │   ├── sistema-handoff.md
│   │   └── versionado-semantico.md
│   ├── context/
│   │   └── decisions/          # ADRs (Architecture Decision Records)
│   ├── templates/              # Templates reutilizables
│   │   └── continuerc-template.json
│   ├── scripts/                # Herramientas de automatización
│   │   └── generate-dashboard.js
│   └── ONBOARDING.md          # Este archivo
│
├── context/                    # Documentación técnica del proyecto
│   ├── dossier_tecnico.md     # Arquitectura y decisiones
│   ├── SPEC-*.md              # Especificaciones técnicas
│   └── DB-FARIENERGYAPP.xlsx  # Modelo de datos
│
├── Checkpoints/                # Historial de progreso
│   └── CHK_YYYY-MM-DD_HHMM.md
│
├── PROYECTO.md                 # 🌟 ESTADO ACTUAL Y TAREAS
├── README.md                   # Setup y comandos
├── AGENTS.md                   # Reglas para agentes IA
├── package.json                # Dependencias del monorepo
├── pnpm-workspace.yaml         # Configuración de workspaces
└── .env.example                # Variables de entorno
```

### Archivos Clave

| Archivo                                          | Propósito                       | Cuándo Leer                             |
| ------------------------------------------------ | ------------------------------- | --------------------------------------- |
| `PROYECTO.md`                                    | Estado actual, tareas, handoffs | **Siempre al empezar**                  |
| `Checkpoints/CHK_*.md`                           | Historial de trabajo            | Antes de continuar trabajo previo       |
| `context/dossier_tecnico.md`                     | Arquitectura y tech stack       | Antes de decisiones técnicas            |
| `metodologia-integra/context/decisions/ADR-*.md` | Decisiones arquitectónicas      | Cuando necesites contexto de decisiones |
| `AGENTS.md`                                      | Reglas de desarrollo            | Antes de commits o PRs                  |

---

## 🤖 Roles de los Agentes

### SOFIA - Arquitecta de Soluciones

**Responsabilidades:**

- 📐 Análisis de requisitos y diseño de arquitectura
- 📝 Creación de especificaciones técnicas (`context/SPEC-*.md`)
- 🏗️ Decisiones arquitectónicas (ADRs)
- 📊 Planificación y priorización de tareas
- 🎯 División de épicas en tareas accionables

**Herramientas Principales:**

- ChatGPT o1-preview / o1-mini
- Gemini 2.0 Flash Thinking

**Output Típico:**

- Specs técnicas completas
- ADRs documentados
- Tareas priorizadas en `PROYECTO.md`
- Propuestas de arquitectura

**Primera Tarea Sugerida:**

- Leer `PROYECTO.md` y `context/dossier_tecnico.md`
- Revisar ADRs existentes
- Identificar gaps en specs o documentación
- Crear ADR para decisión técnica importante pendiente

---

### CODEX - Implementador Backend

**Responsabilidades:**

- 🔧 Desarrollo de APIs (Next.js API Routes)
- 🔥 Integración con Firebase (Firestore, Auth, Storage, Functions)
- 💼 Implementación de lógica de negocio
- 🧪 Testing backend (unitarios e integración)
- ⚡ Optimización de queries y performance

**Herramientas Principales:**

- GitHub Copilot
- Cursor / Continue.dev
- Claude 3.5 Sonnet (para razonamiento complejo)

**Output Típico:**

- API routes en `apps/web/src/app/api/`
- Business logic en `apps/web/src/lib/`
- Tests en `*.test.ts`
- Checkpoints con resultados de tests

**Primera Tarea Sugerida:**

- Ejecutar `pnpm install` y `pnpm run dev --filter @farianergy/web`
- Revisar estructura de API routes existentes
- Ejecutar tests: `pnpm turbo run test --filter @farianergy/web`
- Tomar tarea backend de `PROYECTO.md` marcada como 🔴 Alta prioridad

---

### GEMINI - Implementador Frontend

**Responsabilidades:**

- 🎨 Desarrollo de componentes React/Next.js
- 🔌 Integración de UI con APIs
- 💅 Styling con Tailwind CSS
- 📱 Responsive design y mobile-first
- 🧪 Testing de componentes

**Herramientas Principales:**

- Gemini 2.0 Flash (rápido para UI)
- Claude 3.5 Sonnet (para lógica compleja)
- Cursor / Continue.dev

**Output Típico:**

- Páginas en `apps/web/src/app/`
- Componentes en `apps/web/src/components/`
- Tests en `*.test.tsx`
- Screenshots o demos de UI

**Primera Tarea Sugerida:**

- Ejecutar `pnpm run dev --filter @farianergy/web` y navegar la app
- Revisar componentes existentes en `apps/web/src/components/`
- Identificar componentes reusables para crear library
- Tomar tarea de UI de `PROYECTO.md` marcada como 🔴 Alta prioridad

---

## 🛠️ Setup Técnico

### Requisitos Previos

- **Node.js:** >= 18.0.0 (verificar con `node --version`)
- **pnpm:** >= 8.0.0 (instalar con `npm install -g pnpm@latest`)
- **Git:** >= 2.30
- **Editor:** VS Code (recomendado) con extensiones:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Continue.dev (opcional)

### Instalación Inicial

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd farianergy-app

# 2. Instalar dependencias
pnpm install

# 3. Copiar variables de entorno
cp .env.example apps/web/.env.local

# 4. Configurar Firebase (pedir credenciales al team lead)
# Editar apps/web/.env.local con las credenciales

# 5. Ejecutar en desarrollo
pnpm run dev --filter @farianergy/web

# 6. Abrir en navegador
# http://localhost:3000
```

### Comandos Importantes

```bash
# Desarrollo
pnpm run dev --filter @farianergy/web          # Levantar dev server
pnpm run build --filter @farianergy/web        # Build de producción

# Testing
pnpm turbo run test                            # Todos los tests
pnpm turbo run test --filter @farianergy/web   # Tests de web app
pnpm run test:watch                            # Tests en modo watch

# Linting
pnpm turbo run lint                            # Lint todo el proyecto
pnpm lint --filter @farianergy/web             # Lint solo web app

# Utilities
node metodologia-integra/scripts/generate-dashboard.js  # Generar dashboard
pnpm dlx turbo run where @farianergy/web               # Ubicación del package
```

### Firebase Emulators (Opcional para desarrollo local)

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Ejecutar emulators
firebase emulators:start

# Emulators disponibles:
# - Firestore: localhost:8080
# - Auth: localhost:9099
# - Storage: localhost:9199
```

---

## ⚡ Flujo de Trabajo Básico

### 1. Al Empezar una Sesión

```markdown
✅ Leer PROYECTO.md (sección de estado actual)
✅ Revisar último checkpoint en Checkpoints/
✅ Identificar tarea a realizar (basado en prioridad)
✅ Verificar que no haya bloqueadores
✅ Confirmar setup local funciona (pnpm run dev)
```

### 2. Durante el Trabajo

```markdown
✅ Hacer commits frecuentes con mensajes descriptivos
✅ Ejecutar tests regularmente (pnpm test)
✅ Actualizar PROYECTO.md conforme avances
✅ Documentar decisiones técnicas (inline o ADR)
✅ Crear checkpoint parcial si sesión >2h
```

### 3. Al Finalizar una Sesión

```markdown
✅ Ejecutar pnpm lint y pnpm test (deben pasar)
✅ Crear checkpoint usando plantilla
✅ Actualizar PROYECTO.md con progreso
✅ Documentar handoff si hay trabajo pendiente
✅ Commit y push de cambios
```

---

## 🎯 Reglas de Oro

### Documentación

1. **Siempre leer `PROYECTO.md` primero**
   - Es la fuente de verdad del estado del proyecto
   - Contiene tareas priorizadas y contexto actual

2. **Crear checkpoint al finalizar trabajo significativo**
   - Usar template en `metodologia-integra/meta/plantilla-checkpoint-enriquecido.md`
   - Incluir: archivos modificados, decisiones, tests, próximos pasos

3. **Documentar decisiones técnicas importantes**
   - Crear ADR en `metodologia-integra/context/decisions/` si:
     - Afecta arquitectura
     - Tiene trade-offs significativos
     - Otros necesitarán entender el "por qué"

4. **Actualizar specs cuando cambien requisitos**
   - Specs en `context/SPEC-*.md` deben reflejar estado actual
   - No dejar specs obsoletas

### Código

5. **Tests antes de commit**

   ```bash
   pnpm turbo run test lint
   ```

   - Todos los tests deben pasar
   - Lint sin errores

6. **Commits convencionales**

   ```bash
   feat(equipos): add export to Excel
   fix(rentas): correct timezone calculation
   docs(readme): update setup instructions
   ```

7. **No crear archivos innecesarios**
   - NO crear `README.md` en cada carpeta
   - NO crear documentación que nadie pidió
   - Preferir editar archivos existentes

8. **Seguir estructura existente**
   - API routes en `apps/web/src/app/api/`
   - Componentes en `apps/web/src/components/`
   - Utils en `apps/web/src/lib/`
   - Types en archivos cercanos al uso

### Comunicación

9. **Handoffs claros y completos**
   - Usar template de `metodologia-integra/meta/sistema-handoff.md`
   - Incluir: contexto, trabajo hecho, próximos pasos, bloqueadores

10. **Priorización objetiva**
    - Consultar `metodologia-integra/meta/sistema-priorizacion.md`
    - Usar criterios: Valor de Negocio, Urgencia, Complejidad
    - 🔴 Alta > 🟡 Media > 🟢 Baja

---

## 🚀 Primera Tarea Recomendada

Dependiendo de tu rol:

### Para SOFIA

```markdown
Tarea: Revisar ADRs existentes y crear uno nuevo

1. Leer todos los ADRs en metodologia-integra/context/decisions/
2. Identificar decisión técnica pendiente de documentar
3. Crear ADR-002 (o siguiente número) usando template
4. Ejemplo: ADR para estrategia de testing o manejo de errores
5. Tiempo: ~1h
```

### Para CODEX

```markdown
Tarea: Implementar endpoint faltante

1. Revisar PROYECTO.md, buscar tarea de API marcada 🔴
2. Leer spec técnica relacionada en context/SPEC-\*.md
3. Implementar endpoint en apps/web/src/app/api/
4. Escribir tests en \*.test.ts
5. Crear checkpoint con resultados
6. Tiempo: ~2-3h
```

### Para GEMINI

```markdown
Tarea: Mejorar componente existente

1. Ejecutar app en dev: pnpm run dev --filter @farianergy/web
2. Revisar PROYECTO.md, buscar tarea de UI marcada 🔴
3. Identificar componente a mejorar o crear
4. Implementar con Tailwind CSS
5. Testear responsive (mobile, tablet, desktop)
6. Crear checkpoint con screenshots
7. Tiempo: ~2-3h
```

---

## 🧪 Testing

### Estrategia de Testing

- **Unit Tests:** Lógica de negocio, utils, helpers
- **Integration Tests:** API routes, Firebase interactions
- **E2E Tests:** Flujos críticos de usuario (futuro)

### Ejecutar Tests

```bash
# Todos los tests
pnpm turbo run test

# Tests de un workspace específico
pnpm turbo run test --filter @farianergy/web

# Tests en modo watch
pnpm run test:watch

# Coverage
pnpm turbo run test:coverage
```

### Escribir Tests

```typescript
// apps/web/src/lib/calculations.test.ts
import { describe, it, expect } from "vitest";
import { calculateTotal } from "./calculations";

describe("calculateTotal", () => {
  it("should calculate total with discount", () => {
    const result = calculateTotal(1000, 10); // 10% discount
    expect(result).toBe(900);
  });

  it("should handle zero discount", () => {
    const result = calculateTotal(1000, 0);
    expect(result).toBe(1000);
  });
});
```

---

## 🐛 Troubleshooting

### Problema: `pnpm install` falla

**Solución:**

```bash
# Limpiar caché
pnpm store prune

# Reinstalar
rm -rf node_modules
pnpm install
```

---

### Problema: Firebase error "Missing credentials"

**Solución:**

```bash
# Verificar que .env.local existe
ls apps/web/.env.local

# Verificar que tiene las variables necesarias
cat apps/web/.env.local | grep FIREBASE

# Pedir credenciales al team lead si faltan
```

---

### Problema: Tests fallan con "Cannot find module"

**Solución:**

```bash
# Rebuild
pnpm turbo run build

# Reinstalar deps
pnpm install --frozen-lockfile
```

---

### Problema: Port 3000 ya en uso

**Solución:**

```bash
# Opción 1: Matar proceso en puerto 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Opción 2: Usar otro puerto
PORT=3001 pnpm run dev --filter @farianergy/web
```

---

## 📖 FAQ (Preguntas Frecuentes)

### ¿Cuándo crear un ADR?

**Respuesta:**
Cuando la decisión:

- Afecta la arquitectura del sistema
- Tiene trade-offs significativos
- Requiere justificación para futuros desarrolladores
- Es difícil de revertir

Ejemplos: Elección de DB, framework, patrón de autenticación, estrategia de deployment.

---

### ¿Cuándo crear un checkpoint?

**Respuesta:**

- Al finalizar una tarea completa
- Después de >2h de trabajo continuo
- Antes de hacer handoff a otro agente
- Al finalizar una sesión de trabajo
- Después de un deploy a producción

---

### ¿Cómo decido qué tarea tomar?

**Respuesta:**

1. Ir a `PROYECTO.md`
2. Buscar tareas con tu rol (SOFIA/CODEX/GEMINI)
3. Filtrar por prioridad: 🔴 > 🟡 > 🟢
4. Verificar que no esté bloqueada
5. Verificar que tengas el contexto necesario
6. Tomar la de mayor prioridad que cumpla criterios

Ver `metodologia-integra/meta/sistema-priorizacion.md` para algoritmo detallado.

---

### ¿Qué hago si encuentro un bloqueador?

**Respuesta:**

1. Documentarlo inmediatamente en `PROYECTO.md`
2. Clasificarlo (Técnico, Información, Recurso, etc.)
3. Especificar qué se necesita para desbloquearlo
4. Buscar workaround si es posible
5. Cambiar a otra tarea no bloqueada
6. Notificar en handoff al agente correspondiente

Ver `metodologia-integra/meta/sistema-priorizacion.md` sección de bloqueadores.

---

### ¿Puedo modificar la metodología?

**Respuesta:**
Sí, pero:

1. Crear propuesta en forma de ADR
2. Explicar por qué el cambio mejora el proceso
3. Documentar impacto en flujo actual
4. Obtener consenso (si hay equipo)
5. Actualizar documentación correspondiente

La metodología debe evolucionar, pero de forma documentada.

---

### ¿Qué hago si la documentación está desactualizada?

**Respuesta:**

1. **Corrígela** (no solo reportes que está mal)
2. Si es un error simple: Fix directamente
3. Si requiere decisión: Crear issue o discutir
4. Actualizar fecha de "Última actualización" al final del doc
5. Commit con mensaje descriptivo: `docs: update <documento> with <cambio>`

---

## 🎓 Recursos Adicionales

### Documentación Externa

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest](https://vitest.dev/)

### Metodología

- [Semantic Versioning](https://semver.org/lang/es/)
- [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
- [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/)
- [ADR (Architecture Decision Records)](https://adr.github.io/)

### Herramientas

- [pnpm Documentation](https://pnpm.io/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Continue.dev](https://continue.dev/) (AI code assistant)

---

## ✅ Checklist de Onboarding Completado

Marca cuando hayas completado cada paso:

### Setup Inicial

- [ ] Node.js y pnpm instalados y verificados
- [ ] Repositorio clonado
- [ ] Dependencias instaladas (`pnpm install`)
- [ ] Variables de entorno configuradas
- [ ] App corriendo en desarrollo (`pnpm run dev`)

### Documentación Leída

- [ ] ONBOARDING.md (este documento)
- [ ] PROYECTO.md (estado actual)
- [ ] README.md (setup técnico)
- [ ] AGENTS.md (reglas de desarrollo)
- [ ] context/dossier_tecnico.md (arquitectura)

### Familiarización

- [ ] Estructura del proyecto explorada
- [ ] Últimos 2-3 checkpoints revisados
- [ ] ADRs existentes leídos
- [ ] Comandos básicos ejecutados y funcionando
- [ ] Tests ejecutados exitosamente

### Primera Contribución

- [ ] Primera tarea identificada en PROYECTO.md
- [ ] Contexto necesario recopilado
- [ ] Cambios implementados
- [ ] Tests escritos y pasando
- [ ] Checkpoint creado
- [ ] Commit con conventional commit message

---

## 🎉 ¡Felicidades!

Has completado el onboarding. Ahora estás listo para contribuir al proyecto Farianergy App usando la Metodología INTEGRA.

### Próximos Pasos

1. **Tomar tu primera tarea** de `PROYECTO.md`
2. **Consultar esta guía** cuando tengas dudas
3. **Mejorar la documentación** cuando encuentres gaps
4. **Compartir feedback** sobre la metodología

---

## 🤝 Contacto y Soporte

Si tienes preguntas que esta guía no responde:

1. Revisa los otros documentos en `metodologia-integra/meta/`
2. Busca en los checkpoints previos (similar ya se resolvió?)
3. Crea un issue en el repositorio
4. Documenta la respuesta para futuros desarrolladores

---

**Versión:** 1.0.0  
**Última Actualización:** 2025-11-08  
**Mantenido por:** Metodología INTEGRA  
**Autores:** SOFIA, CODEX, GEMINI

---

**¡Bienvenido al equipo!** 🚀
