# Soft Gates - Puertas de Calidad

**Versión:** 1.0  
**Proyecto:** Metodología Integra Evolucionada  
**Última actualización:** 2025-11-08

---

## Concepto

Los **Soft Gates** (Puertas de Calidad) son puntos de verificación obligatorios que toda tarea debe pasar antes de ser marcada como completada `[✓]`.

> "No puedes marcar una tarea como completada si alguno de los gates falla."

---

## Los 4 Gates Obligatorios

```
Gate 1: Compilación → Gate 2: Testing → Gate 3: Revisión → Gate 4: Documentación → [✓]
```

Cada gate debe pasar **exitosamente** para avanzar al siguiente. Si alguno falla, la tarea vuelve a estado `[/]` para corrección.

---

## Gate 1: Compilación ✅

### Objetivo

Garantizar que el código es sintácticamente correcto y cumple con estándares básicos.

### Verificaciones Obligatorias

#### TypeScript

```bash
# Debe pasar sin errores
pnpm tsc --noEmit

# Resultado esperado
✓ Found 0 errors
```

**Criterios de aprobación:**

- ❌ **0 errores** (obligatorio)
- ⚠️ Warnings permitidos, pero deben documentarse

#### ESLint

```bash
# Debe pasar sin errores críticos
pnpm lint

# O específico por paquete
pnpm lint --filter @farianergy/core
```

**Criterios de aprobación:**

- ❌ **0 errores** (obligatorio)
- ⚠️ Warnings < 5 (preferiblemente 0)
- 💡 Info messages permitidos

### Responsable

**SOFIA** ejecuta y verifica Gate 1 antes de pasar a `[V]`.

### Ejemplo de Fallo

```markdown
- [/] Implementación de API de pagos
  **Gate 1: FAILED ❌**
  - TypeScript: 3 errors
    - src/api/payments.ts:45 - Type 'string' not assignable to 'number'
    - src/api/payments.ts:67 - Property 'amount' does not exist
    - src/lib/validators.ts:12 - Argument of type 'unknown' not assignable
  - ESLint: 1 error, 3 warnings
    - error: 'paymentId' is defined but never used

  **Acción:** SOFIA corrige errores y re-ejecuta Gate 1
```

### Ejemplo de Éxito

```markdown
- [V] Implementación de API de pagos
  **Gate 1: PASSED ✅**
  - TypeScript: 0 errors
  - ESLint: 0 errors, 2 warnings (acceptable)
    - warning: Consider using optional chaining (payment?.id)

  **Siguiente:** Proceder a Gate 2 (Testing)
```

---

## Gate 2: Testing 🧪

### Objetivo

Garantizar que el código funciona correctamente y no introduce regresiones.

### Verificaciones Obligatorias

#### Tests Unitarios

```bash
# Vitest (cuando esté configurado)
pnpm test --filter <paquete>

# Jest (legacy)
pnpm jest --coverage
```

**Criterios de aprobación:**

- ✅ **100% de tests pasan** (obligatorio)
- 📊 **Coverage mínimo:**
  - Funciones nuevas: 80%
  - Proyecto global: 60% (objetivo: 80%)

#### Tests de Integración (si aplica)

```bash
pnpm test:integration
```

**Criterios de aprobación:**

- ✅ **Todos pasan** (si existen)
- ⏭️ Si no existen, documentar como deuda técnica

### Responsable

**SOFIA** ejecuta Gate 2 durante estado `[V]`.

### Excepciones Permitidas

#### 1. Feature sin tests (temporal)

```markdown
**Gate 2: SKIPPED ⏭️**

- Razón: Prototipo rápido para validación de Frank
- Deuda técnica creada: DEBT-001
- Compromiso: Agregar tests antes de [X] Aprobado
```

#### 2. Cambios triviales

```markdown
**Gate 2: N/A**

- Razón: Solo cambios en documentación (.md files)
- No requiere tests
```

### Ejemplo de Fallo

```markdown
- [V] Implementación de API de pagos
  **Gate 1: PASSED ✅**
  **Gate 2: FAILED ❌**
  - Tests unitarios: 12/15 passed (80%)
    - ❌ calculateTax() fails for negative amounts
    - ❌ validatePayment() fails for empty payload
    - ❌ processRefund() timeout (>5s)
  - Coverage: 65% (objetivo: 80%)
    - Missing: Error handling en processPayment()

  **Acción:** SOFIA vuelve a [/] para corregir tests
```

### Ejemplo de Éxito

```markdown
- [V] Implementación de API de pagos
  **Gate 1: PASSED ✅**
  **Gate 2: PASSED ✅**
  - Tests unitarios: 18/18 passed (100%)
  - Tests integración: 5/5 passed (100%)
  - Coverage: 87% (✓ > 80%)

  **Siguiente:** Proceder a Gate 3 (Revisión)
```

---

## Gate 3: Revisión de Código 👁️

### Objetivo

Garantizar calidad, mantenibilidad y seguridad del código mediante auditoría humana/IA.

### Checklist de Revisión (GEMINI)

#### 3.1 Convenciones de Código

```markdown
- [ ] Cumple SPEC-CODIGO.md §II (Convenciones de Nombres)
- [ ] Cumple SPEC-CODIGO.md §III (Política de Comentarios)
- [ ] Cumple SPEC-CODIGO.md §V (Estándares TypeScript)
- [ ] Sin código comentado (dead code)
- [ ] Imports organizados correctamente
```

#### 3.2 Calidad de Código

```markdown
- [ ] No hay código duplicado
- [ ] Funciones < 50 líneas (preferiblemente < 30)
- [ ] Complejidad ciclomática aceptable
- [ ] Sin "code smells" obvios
- [ ] Principios SOLID aplicados (cuando aplique)
```

#### 3.3 Seguridad

```markdown
- [ ] No hay secretos hardcoded
- [ ] Validación de inputs en APIs públicas
- [ ] Manejo de errores apropiado (no expone stack traces)
- [ ] Sin vulnerabilidades obvias (SQL injection, XSS, etc.)
- [ ] Cumple SPEC-SEGURIDAD.md (si aplica)
```

#### 3.4 Performance

```markdown
- [ ] Sin loops innecesarios O(n²) cuando puede ser O(n)
- [ ] Queries a BD optimizadas
- [ ] Sin memory leaks obvios
- [ ] Lazy loading donde sea posible
```

#### 3.5 Mantenibilidad

```markdown
- [ ] Lógica clara y fácil de entender
- [ ] Sin acoplamiento excesivo
- [ ] Fácil de testear
- [ ] Documentación JSDoc en APIs públicas
```

### Responsable

**GEMINI** (Gemini Code Assist) ejecuta Gate 3 durante estado `[R]`.

### Formatos de Revisión

#### Aprobación Directa

```markdown
- [R] Implementación de API de pagos
  **Gate 3: PASSED ✅**
  **Revisor:** GEMINI
  **Fecha:** 2025-11-08 16:30

  **Resumen:**
  - ✅ Código limpio y bien estructurado
  - ✅ Tipado fuerte en todas las funciones
  - ✅ Manejo de errores robusto
  - ✅ Sin vulnerabilidades detectadas
  - ✅ Performance óptima

  **Observaciones menores:**
  - 💡 Considerar extraer validatePaymentInput() a utils
  - 💡 Agregar JSDoc a calculateTax()

  **Decisión:** APROBADO - Proceder a Gate 4
```

#### Aprobación Condicional (Cambios Menores)

```markdown
- [R] Implementación de API de pagos
  **Gate 3: CONDITIONAL PASS ⚠️**
  **Revisor:** GEMINI

  **Cambios requeridos (menores):**
  1. Renombrar `amt` a `amount` (línea 45) - claridad
  2. Agregar comentario explicativo en cálculo de impuestos (línea 67)
  3. Extraer constante `TAX_RATE = 0.16`

  **Sin bloqueo:** SOFIA puede hacer cambios sin volver a [/]
  **Re-review:** No requerido (cambios triviales)
```

#### Rechazo (Cambios Mayores)

```markdown
- [R] Implementación de API de pagos
  **Gate 3: FAILED ❌**
  **Revisor:** GEMINI

  **Problemas críticos:**
  1. 🔴 Función processPayment() tiene 150 líneas - refactorizar
  2. 🔴 Lógica de cálculo de impuestos duplicada en 3 lugares
  3. 🔴 No hay validación de monto negativo
  4. 🟡 Variables `data`, `result`, `temp` - nombres no descriptivos
  5. 🟡 Sin manejo de error cuando Stripe API falla

  **Acción:** Volver a [/] para refactorización mayor
  **Tiempo estimado de corrección:** 2-3 horas
```

### Ejemplo de Éxito Completo

```markdown
- [R] Implementación de API de pagos
  **Gate 1: PASSED ✅**
  **Gate 2: PASSED ✅**
  **Gate 3: PASSED ✅**
  - Revisor: GEMINI
  - Calificación: 9.5/10
  - Comentarios: Código ejemplar, listo para producción

  **Siguiente:** Proceder a Gate 4 (Documentación)
```

---

## Gate 4: Documentación 📚

### Objetivo

Garantizar que el código esté documentado y sea comprensible para futuros desarrolladores.

### Verificaciones Obligatorias

#### 4.1 README.md (si aplica)

```markdown
- [ ] README.md actualizado con nuevos endpoints/features
- [ ] Ejemplos de uso agregados
- [ ] Dependencias nuevas documentadas
```

**Cuándo aplica:**

- Nueva feature pública
- Nuevo paquete/módulo
- Cambio en API pública

**Cuándo NO aplica:**

- Cambios internos
- Bugfixes menores
- Refactorización sin cambios en API

#### 4.2 dossier_tecnico.md

```markdown
- [ ] Decisiones técnicas importantes documentadas
- [ ] Cambios arquitectónicos registrados
- [ ] Trade-offs explicados
```

**Ejemplo:**

```markdown
### 2025-11-08 - Implementación de API de Pagos

**Decisión:** Usar Stripe como pasarela de pago principal
**Razón:** Mayor adopción en México, mejor documentación que Conekta
**Alternativas:** Conekta, Mercado Pago, OpenPay
**Trade-offs:** Comisiones 3.6% + $3 MXN vs 3.5% de Conekta

**Implementación:**

- `apps/web/src/lib/stripe-client.ts` - Cliente Stripe
- `apps/web/src/app/api/payments/route.ts` - API REST
- `packages/core/src/types.ts` - Tipos de pago
```

#### 4.3 Comentarios en Código (solo si es necesario)

```markdown
- [ ] Decisiones no obvias comentadas (ver SPEC-CODIGO.md §III)
- [ ] JSDoc en funciones públicas
- [ ] TODOs con tickets de seguimiento
```

**Ejemplo de JSDoc:**

````typescript
/**
 * Calcula el impuesto total de una transacción.
 *
 * @param amount - Monto base en centavos (1000 = $10.00 MXN)
 * @param taxRate - Tasa de impuesto (0.16 = 16%)
 * @returns Impuesto calculado en centavos
 * @throws {Error} Si amount es negativo
 *
 * @example
 * ```typescript
 * const tax = calculateTax(10000, 0.16); // 1600 centavos ($16.00)
 * ```
 */
export function calculateTax(amount: number, taxRate: number): number {
  if (amount < 0) throw new Error("Amount cannot be negative");
  return Math.round(amount * taxRate);
}
````

#### 4.4 Changelog / PROYECTO.md

```markdown
- [ ] PROYECTO.md actualizado con estado [✓]
- [ ] Checkpoint generado (CHK_YYYY-MM-DD_HHMM.md)
```

### Responsable

**CODEX** verifica Gate 4 antes de marcar `[✓]`.

### Ejemplo de Fallo

```markdown
- [/] Implementación de API de pagos
  **Gate 1: PASSED ✅**
  **Gate 2: PASSED ✅**
  **Gate 3: PASSED ✅**
  **Gate 4: FAILED ❌**

  **Faltantes:**
  - ❌ README.md no menciona nuevos endpoints /api/payments
  - ❌ dossier_tecnico.md sin decisión de usar Stripe
  - ❌ Función calculateTax() sin JSDoc

  **Acción:** CODEX solicita a SOFIA completar documentación
  **Tiempo estimado:** 30 min
```

### Ejemplo de Éxito

```markdown
- [✓] Implementación de API de pagos
  **Gate 1: PASSED ✅** (TypeScript + ESLint)
  **Gate 2: PASSED ✅** (Tests 100%, Coverage 87%)
  **Gate 3: PASSED ✅** (Revisión GEMINI aprobada)
  **Gate 4: PASSED ✅** (Documentación completa)

  **Checkpoint:** CHK_2025-11-08_1730.md
  **Listo para:** Aprobación de Frank [X]
```

---

## Matriz de Decisión

| Resultado Gates | Próximo Estado | Acción Requerida               |
| --------------- | -------------- | ------------------------------ |
| ✅✅✅✅        | `[✓]`          | Marcar como completado         |
| ❌...           | `[/]`          | SOFIA corrige                  |
| ✅❌..          | `[/]`          | SOFIA corrige tests            |
| ✅✅❌.         | `[/]`          | SOFIA refactoriza según GEMINI |
| ✅✅✅❌        | `[/]`          | SOFIA/CODEX completan docs     |
| ⏭️⏭️⏭️⏭️        | `[!]`          | Bloqueador crítico, escalar    |

---

## Excepciones y Casos Especiales

### 1. Prototipo Rápido (Spike)

```markdown
**Gates:** ⏭️ Todos skipped temporalmente
**Razón:** Validación rápida de concepto para Frank
**Compromiso:** Re-hacer con gates antes de [X] Aprobado
**Ticket de Seguimiento:** DEBT-001
```

### 2. Hotfix Crítico en Producción

```markdown
**Gates:** ✅❌⏭️⏭️ (Solo Gate 1)
**Razón:** Bug crítico bloqueando usuarios
**Compromiso:** Agregar tests y docs en próximo sprint
**Aprobación especial:** Frank autoriza bypass
```

### 3. Cambios Solo de Documentación

```markdown
**Gates:** N/A N/A N/A ✅
**Razón:** Solo cambios en archivos .md
**Validación:** CODEX revisa redacción y formato
```

---

## Automatización (Futuro)

### GitHub Actions (Propuesta)

```yaml
name: Soft Gates CI

on: [push, pull_request]

jobs:
  gate-1-compilation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm tsc --noEmit
      - run: pnpm lint

  gate-2-testing:
    needs: gate-1-compilation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm test --coverage
      - name: Check coverage
        run: |
          COVERAGE=$(cat coverage/summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 60" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 60%"
            exit 1
          fi
```

---

## Notación en PROYECTO.md

### Formato Compacto

```markdown
- [✓] Implementación de API de pagos
  **Gates:** ✅ Compilación | ✅ Tests (87%) | ✅ Revisión | ✅ Docs
```

### Formato Extendido

```markdown
- [✓] Implementación de API de pagos
  **Soft Gates:**
  - [✅] Gate 1: Compilación (TypeScript + ESLint)
  - [✅] Gate 2: Testing (18/18 tests, 87% coverage)
  - [✅] Gate 3: Revisión (GEMINI aprobó)
  - [✅] Gate 4: Documentación (README + dossier_tecnico)

  **Checkpoint:** CHK_2025-11-08_1730.md
```

---

**Versión:** 1.0  
**Autor:** Frank Saavedra  
**IA Colaboradora:** Verdent (Claude Sonnet 4)  
**Fecha:** 2025-11-08
