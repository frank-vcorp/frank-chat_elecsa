# Architecture Decision Records (ADRs)

## 📚 ¿Qué son los ADRs?

Los **Architecture Decision Records** (Registros de Decisiones de Arquitectura) documentan decisiones técnicas significativas que impactan la arquitectura, diseño o implementación del proyecto. Capturan el **contexto, razonamiento y consecuencias** de cada decisión para que futuros desarrolladores (o agentes IA) entiendan el "por qué" detrás del "qué".

---

## 🎯 Objetivo

- **Preservar conocimiento:** Evitar que el razonamiento detrás de decisiones se pierda con el tiempo
- **Facilitar onboarding:** Nuevos miembros del equipo pueden entender decisiones pasadas rápidamente
- **Reducir debates recurrentes:** Las decisiones documentadas no se re-litigan constantemente
- **Aprender de errores:** Decisiones que no funcionaron se documentan para evitar repetirlas
- **Contexto para cambios:** Saber qué consideraciones existían cuando se tome una decisión ayuda a cambiarla apropiadamente

---

## 📋 Cuándo Crear un ADR

### ✅ SÍ crear ADR para:

- **Decisiones de arquitectura:** Elección de frameworks, bibliotecas principales, patrones de diseño
- **Tecnología principal:** Base de datos, autenticación, deployment, CI/CD
- **Estándares de código:** Convenciones de naming, estructura de archivos, guías de estilo
- **Cambios que afectan a múltiples equipos/módulos**
- **Trade-offs significativos:** Decisiones con pros/contras importantes
- **Desviaciones de estándares:** Cuando NO seguir un best practice común

### ❌ NO crear ADR para:

- Cambios triviales o puramente estéticos
- Decisiones fácilmente reversibles sin costo
- Implementaciones de detalles menores
- Cambios temporales o experimentales (usar "spike" o "PoC" doc en su lugar)

---

## 📝 Estructura de un ADR

Cada ADR sigue este formato (ver `ADR-TEMPLATE.md`):

```markdown
# ADR-XXX: Título de la Decisión

**Estado:** [Propuesta | Aceptada | Rechazada | Deprecada | Supersedida por ADR-YYY]

**Fecha:** YYYY-MM-DD

**Autores:** [Nombres o agentes]

**Stakeholders:** [Quién se ve afectado]

## Contexto
[Situación y fuerzas que llevaron a necesitar una decisión]

## Decisión
[Qué se decidió hacer]

## Alternativas Consideradas
[Otras opciones evaluadas y por qué se descartaron]

## Consecuencias
### Positivas
[Beneficios de esta decisión]

### Negativas
[Trade-offs, limitaciones o deuda técnica]

### Neutras
[Otros efectos que no son claramente positivos/negativos]

## Notas de Implementación
[Detalles técnicos relevantes]

## Referencias
[Enlaces a docs, RFCs, issues, etc.]
```

---

## 🔢 Numeración y Naming

### Convención de Nombres

```
ADR-XXX-descripcion-corta.md

Donde:
- XXX = número secuencial de 3 dígitos (001, 002, ..., 150)
- descripcion-corta = slug kebab-case del título
```

**Ejemplos:**
- `ADR-001-uso-pnpm-como-package-manager.md`
- `ADR-002-firebase-como-backend.md`
- `ADR-003-monorepo-con-turborepo.md`
- `ADR-015-estrategia-de-testing.md`

### Secuencia de Números

Los números son **secuenciales e inmutables**:
- Una vez asignado un número, NO se reutiliza aunque se rechace la decisión
- Los números reflejan el orden cronológico de creación
- Gaps en la secuencia son normales (decisiones rechazadas o eliminadas)

---

## 📊 Estados de un ADR

| Estado | Descripción | Acción |
|--------|-------------|--------|
| **Propuesta** | Decisión en discusión, no final | Continuar debate |
| **Aceptada** | Decisión aprobada e implementada | Seguir la decisión |
| **Rechazada** | Propuesta evaluada pero descartada | No implementar, aprender |
| **Deprecada** | Era válida pero ya no aplica | Migrar gradualmente |
| **Supersedida** | Reemplazada por un ADR más nuevo | Ver ADR de reemplazo |

---

## 🗂️ Organización de ADRs

```
metodologia-integra/context/decisions/
├── README.md (este archivo)
├── ADR-TEMPLATE.md (plantilla)
├── ADR-001-uso-pnpm.md
├── ADR-002-firebase-backend.md
├── ADR-003-monorepo-turborepo.md
└── ...
```

### Indexación por Categoría

Para facilitar búsqueda, mantener un índice al final de este README:

#### Por Categoría

**Infraestructura:**
- ADR-001: Uso de pnpm como package manager
- ADR-003: Monorepo con Turborepo

**Backend:**
- ADR-002: Firebase como backend (Auth, Firestore, Storage)

**Frontend:**
- ADR-004: Next.js 14 con App Router (pending)

**Testing:**
- ADR-015: Estrategia de testing (unit/integration/e2e) (pending)

#### Por Estado

**Aceptadas:** ADR-001, ADR-002, ADR-003
**Propuestas:** ADR-004, ADR-015
**Rechazadas:** —
**Deprecadas:** —

---

## 🔄 Proceso de Creación de ADR

### 1. Identificar la Necesidad

Surge cuando:
- Hay múltiples opciones válidas para resolver un problema
- La decisión tendrá impacto duradero
- Otros necesitarán entender el razonamiento

### 2. Investigar y Documentar Opciones

- Investigar al menos 2-3 alternativas
- Documentar pros/contras de cada una
- Buscar precedentes (qué han hecho proyectos similares)

### 3. Crear Borrador del ADR

```bash
# Copiar template
cp ADR-TEMPLATE.md ADR-XXX-titulo.md

# Llenar secciones
# Estado: Propuesta
```

### 4. Revisar y Discutir

- Compartir con stakeholders (en caso de proyecto con equipo)
- Iterar basado en feedback
- Documentar todas las perspectivas consideradas

### 5. Decidir y Finalizar

- Cambiar estado a "Aceptada" o "Rechazada"
- Si se acepta: crear tareas de implementación
- Actualizar índice en este README

### 6. Implementar (si Aceptada)

- Seguir la decisión documentada
- Referenciar el ADR en PRs relacionados
- Actualizar ADR si aparecen nuevas consecuencias

---

## 🔗 Referencias en Código

Cuando implementes algo basado en un ADR, referéncialo en comentarios:

```typescript
// ADR-002: Usamos Firebase Auth para autenticación
// Ver: metodologia-integra/context/decisions/ADR-002-firebase-backend.md
import { getAuth } from 'firebase/auth';
```

---

## 📖 Ejemplo Completo

Ver `ADR-001-ejemplo-uso-pnpm.md` para un ejemplo real del proyecto Farianergy.

---

## 🔄 Modificar o Deprecar un ADR

### Si una decisión necesita cambiar:

1. **NO edites el ADR original** (excepto para marcar estado como "Supersedida")
2. **Crea un nuevo ADR** que:
   - Explique por qué la decisión original ya no aplica
   - Documente la nueva decisión
   - Referencie el ADR original
3. **Actualiza el ADR original:**
   ```markdown
   **Estado:** Supersedida por ADR-042
   ```

### Ejemplo:

```markdown
# ADR-010: Usar REST para API

**Estado:** Supersedida por ADR-042
**Fecha:** 2024-06-15

[contenido original...]

---

## Nota de Deprecación (2025-02-20)

Esta decisión fue reemplazada por ADR-042: Migración a GraphQL debido a:
- Complejidad creciente de endpoints
- Necesidad de reducir over-fetching
- Mejor developer experience con type safety
```

---

## ✅ Checklist de Calidad de un ADR

Antes de finalizar un ADR, verificar:

- [ ] El título es claro y específico
- [ ] El contexto explica el problema, no solo la solución
- [ ] Se documentan al menos 2 alternativas
- [ ] Las consecuencias incluyen trade-offs honestos
- [ ] El estado está actualizado
- [ ] La fecha es correcta
- [ ] Está indexado en este README
- [ ] El número no está duplicado
- [ ] El formato sigue el template

---

## 📚 Recursos Adicionales

- [ADR GitHub Organization](https://adr.github.io/)
- [Documenting Architecture Decisions - Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR Tools](https://github.com/npryce/adr-tools)

---

## 📊 Estadísticas del Proyecto

**Total ADRs:** 3
**Aceptadas:** 3
**Propuestas:** 0
**Rechazadas:** 0
**Deprecadas:** 0

**Última actualización:** 2025-11-08

---

**Mantenedores:** Metodología INTEGRA
**Versión:** 1.0
