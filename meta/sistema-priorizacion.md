# Sistema de Priorización - Metodología INTEGRA

## 🎯 Objetivo

Establecer un sistema consistente para evaluar, priorizar y gestionar tareas en el proyecto, permitiendo a todos los agentes (SOFIA, CODEX, GEMINI) tomar decisiones informadas sobre qué trabajar primero.

---

## 📊 Template de Metadatos para Tareas

Cada tarea en `PROYECTO.md` debe incluir estos metadatos:

```markdown
### [ID] Nombre de la Tarea

**Metadatos:**
- 🎯 **Prioridad:** [🔴 Alta | 🟡 Media | 🟢 Baja]
- ⏱️ **Estimación:** [Xh Ym]
- 👤 **Asignado:** [SOFIA | CODEX | GEMINI | Sin asignar]
- 📦 **Sprint:** [Sprint X | Backlog]
- 🏷️ **Tags:** `#feature` `#bug` `#refactor` `#docs` `#test`
- 🔗 **Dependencias:** [IDs de tareas previas]
- 🚧 **Bloqueadores:** [Descripción si aplica]
- 📅 **Deadline:** [YYYY-MM-DD o "Flexible"]
- 💰 **Valor de Negocio:** [Alto | Medio | Bajo]
- 🔧 **Complejidad Técnica:** [Alta | Media | Baja]

**Descripción:**
[Descripción detallada de la tarea]

**Criterios de Aceptación:**
- [ ] Criterio 1
- [ ] Criterio 2
```

---

## 🚦 Escala de Prioridad

### 🔴 Prioridad Alta (Crítica)

**Cuándo usar:**
- ❗ **Bloqueadores:** Impide el progreso de otras tareas o del equipo
- 🐛 **Bugs Críticos:** Afecta funcionalidad core o producción
- 🔐 **Seguridad:** Vulnerabilidades o exposición de datos
- 📅 **Deadlines Inmediatos:** Vence en <48h
- 💼 **Requisito del Cliente:** Solicitado explícitamente con urgencia
- 🔥 **Producción Down:** Sistema no operativo

**Criterios de priorización:**
```
Puntaje = (Valor_Negocio * 3) + (Urgencia * 2) - (Complejidad * 0.5)

Donde:
- Valor_Negocio: 1-10 (impacto en el cliente/negocio)
- Urgencia: 1-10 (qué tan pronto se necesita)
- Complejidad: 1-10 (dificultad técnica)

Si Puntaje >= 25 → 🔴 Alta
```

**SLA (Service Level Agreement):**
- Tiempo de respuesta: Inmediato
- Tiempo de resolución objetivo: <24h
- Revisión diaria obligatoria

**Ejemplos Farienergy:**
- 🔴 Fix: Firebase Auth no permite login (producción)
- 🔴 Implementar validación de pagos antes de demo con cliente
- 🔴 Corregir cálculo de rentas que genera cobros incorrectos

---

### 🟡 Prioridad Media (Importante)

**Cuándo usar:**
- ✨ **Features Planificadas:** En el sprint actual
- 🐛 **Bugs No Críticos:** Afecta UX pero hay workaround
- 📈 **Mejoras de Performance:** Optimizaciones significativas
- 📚 **Documentación Importante:** Necesaria para onboarding
- 🧪 **Tests Faltantes:** Cobertura crítica pero no bloqueante
- 📅 **Deadlines Mediano Plazo:** Vence en 3-7 días

**Criterios de priorización:**
```
Si 15 <= Puntaje < 25 → 🟡 Media
```

**SLA:**
- Tiempo de respuesta: <24h
- Tiempo de resolución objetivo: 2-5 días
- Revisión semanal en sprint planning

**Ejemplos Farienergy:**
- 🟡 Implementar filtros avanzados en tabla de equipos
- 🟡 Añadir validación de formulario de clientes
- 🟡 Documentar API endpoints en Swagger
- 🟡 Refactorizar componente de rentas para mejor reusabilidad

---

### 🟢 Prioridad Baja (Deseable)

**Cuándo usar:**
- 💡 **Nice to Have:** Mejoras que agregan valor pero no son urgentes
- 🎨 **UI/UX Enhancements:** Pulir detalles visuales
- 🧹 **Refactors Menores:** Limpieza de código sin impacto funcional
- 📝 **Documentación Adicional:** Guías o tutoriales extra
- 🔬 **Experimentos:** Pruebas de concepto o investigación
- 📅 **Sin Deadline:** Backlog sin fecha límite

**Criterios de priorización:**
```
Si Puntaje < 15 → 🟢 Baja
```

**SLA:**
- Tiempo de respuesta: Cuando haya capacidad
- Tiempo de resolución objetivo: Flexible
- Revisión mensual en backlog grooming

**Ejemplos Farienergy:**
- 🟢 Añadir tema oscuro a la UI
- 🟢 Crear dashboard de métricas de uso interno
- 🟢 Investigar migración a Turbopack
- 🟢 Añadir animaciones a transiciones de página

---

## ⏱️ Sistema de Estimación

### Tallas de Camiseta → Horas

| Talla | Horas | Descripción | Ejemplos |
|-------|-------|-------------|----------|
| **XS** | 0.5-1h | Cambio trivial, una función o componente pequeño | Fix typo, ajustar color, añadir prop |
| **S** | 1-3h | Cambio simple, un archivo o componente | Nuevo componente UI, endpoint CRUD básico |
| **M** | 3-8h | Feature pequeño, varios archivos | Formulario completo con validación |
| **L** | 8-16h | Feature mediano, múltiples componentes | Sistema de auth completo |
| **XL** | 16-40h | Feature grande, varios módulos | Dashboard con múltiples vistas |
| **XXL** | 40+h | Épica, requiere dividir en tareas | Migración completa de base de datos |

### Factores de Ajuste

**Multiplicadores por complejidad:**
- 🟢 **Baja:** x1.0 (código directo, sin dependencias)
- 🟡 **Media:** x1.5 (requiere investigación o integración)
- 🔴 **Alta:** x2.5 (arquitectura compleja, múltiples integraciones)

**Multiplicadores por experiencia:**
- 🧠 **Experto en el área:** x0.8
- 📚 **Conocimiento medio:** x1.0
- 🆕 **Primera vez con la tech:** x1.8

**Fórmula final:**
```
Estimación_Real = Base_Horas * Complejidad * Experiencia * 1.2

(El 1.2 es buffer para imprevistos)
```

### Ejemplos de Estimación Farienergy

**Tarea:** Implementar CRUD de Equipos
- **Base:** M (5h promedio)
- **Complejidad:** Media (x1.5) - requiere Firestore + validación
- **Experiencia:** Experto (x0.8) - ya hicimos otros CRUDs
- **Cálculo:** 5 * 1.5 * 0.8 * 1.2 = **7.2h → 7h 15m**

**Tarea:** Migrar de REST a GraphQL
- **Base:** XXL (50h promedio)
- **Complejidad:** Alta (x2.5) - cambio arquitectónico
- **Experiencia:** Primera vez (x1.8) - nuevo con GraphQL
- **Cálculo:** 50 * 2.5 * 1.8 * 1.2 = **270h → Épica, dividir**

---

## 🔗 Gestión de Dependencias

### Tipos de Dependencias

1. **Técnicas (Finish-to-Start):**
   - La tarea B no puede empezar hasta que A termine
   - Ejemplo: "Implementar API de pagos" depende de "Configurar Stripe"

2. **Lógicas (Finish-to-Finish):**
   - La tarea B no puede terminar hasta que A termine
   - Ejemplo: "Documentar API" depende de "Finalizar todos los endpoints"

3. **Recursos (Compartidas):**
   - Ambas tareas requieren el mismo recurso limitado
   - Ejemplo: Dos tareas requieren revisión del mismo desarrollador

4. **Información:**
   - La tarea B necesita información producida por A
   - Ejemplo: "Escribir tests" necesita conocer la spec de "Diseñar API"

### Formato en PROYECTO.md

```markdown
### [T-045] Implementar Sistema de Notificaciones

**Metadatos:**
- 🔗 **Dependencias:**
  - ✅ [T-023] Configurar Firebase Cloud Messaging (completada)
  - 🚧 [T-041] Diseñar templates de emails (en progreso)
  - ⏳ [T-038] Definir triggers de eventos (bloqueada)
  
- 🔄 **Esta tarea bloquea a:**
  - [T-050] Implementar notificaciones push en mobile
  - [T-051] Dashboard de notificaciones para admin
```

### Visualización de Cadena Crítica

Para identificar el camino más largo de dependencias:

```
[T-020] Setup Firebase (2h)
    ↓
[T-023] Config FCM (3h)
    ↓
[T-045] Sistema Notificaciones (8h)
    ↓
[T-050] Push Notifications Mobile (6h)
    ↓
[T-055] Testing End-to-End (4h)

TOTAL: 23h (Cadena crítica - cualquier retraso impacta el deadline)
```

---

## 🚧 Detección y Gestión de Bloqueadores

### Tipos de Bloqueadores

| Tipo | Símbolo | Descripción | Acción |
|------|---------|-------------|--------|
| **Técnico** | 🔧 | Falta herramienta, librería o config | Investigar alternativas o solicitar instalación |
| **Información** | ❓ | Faltan requisitos o clarificación | Contactar stakeholder, documentar asunciones |
| **Dependencia** | ⛓️ | Tarea previa no completada | Re-priorizar o paralelizar si es posible |
| **Recurso** | 👤 | Persona o servicio no disponible | Buscar alternativa o agendar |
| **Aprobación** | ✋ | Requiere review o sign-off | Notificar y seguir mientras tanto |
| **Ambiente** | 🌍 | Problema con dev/staging/prod | Usar emuladores o ambiente alternativo |

### Protocolo de Bloqueadores

**Cuando encuentres un bloqueador:**

1. **Documentar inmediatamente** en PROYECTO.md:
   ```markdown
   🚧 **BLOQUEADOR ACTIVO**
   - **Tipo:** 🔧 Técnico
   - **Descripción:** Firebase Emulator no arranca en Windows
   - **Impacto:** No se pueden probar Cloud Functions localmente
   - **Detectado:** 2025-11-08 10:30
   - **Severidad:** 🟡 Media (hay workaround con deploy a dev)
   - **Owner:** CODEX
   ```

2. **Evaluar severidad:**
   - 🔴 **Crítico:** Bloquea todo el trabajo → Escalar inmediatamente
   - 🟡 **Alto:** Bloquea esta tarea → Buscar workaround o cambiar de tarea
   - 🟢 **Bajo:** Ralentiza pero no bloquea → Continuar y resolver después

3. **Tomar acción:**
   - Buscar solución (30 min max)
   - Documentar workaround si lo hay
   - Cambiar a otra tarea no bloqueada
   - Notificar en handoff al siguiente agente

4. **Actualizar estado:**
   ```markdown
   ✅ **BLOQUEADOR RESUELTO**
   - **Solución:** Usar WSL2 para emuladores en lugar de Windows nativo
   - **Resuelto:** 2025-11-08 14:45
   - **Tiempo perdido:** 4h 15m
   - **Lección:** Documentado en ONBOARDING.md para futuros agentes
   ```

---

## 📋 Ejemplos Completos

### Ejemplo 1: Feature Nueva

```markdown
### [T-067] Implementar Carga Masiva de Equipos desde Excel

**Metadatos:**
- 🎯 **Prioridad:** 🟡 Media
- ⏱️ **Estimación:** 6h 30m
  - Base: M (5h)
  - Complejidad: Media (x1.5) - parsing Excel + validación
  - Experiencia: Medio (x1.0)
  - Buffer: x1.2
  - Cálculo: 5 * 1.5 * 1.0 * 1.2 = 9h → Reducido a 6.5h tras spike técnico
- 👤 **Asignado:** CODEX
- 📦 **Sprint:** Sprint 3
- 🏷️ **Tags:** `#feature` `#import` `#excel` `#equipos`
- 🔗 **Dependencias:**
  - ✅ [T-034] CRUD Equipos completado
  - ✅ [T-056] Validaciones de negocio definidas
- 🚧 **Bloqueadores:** Ninguno
- 📅 **Deadline:** 2025-11-15 (Flexible)
- 💰 **Valor de Negocio:** Alto (cliente lo solicitó explícitamente)
- 🔧 **Complejidad Técnica:** Media

**Descripción:**
Permitir al administrador cargar múltiples equipos desde un archivo Excel (.xlsx) en lugar de ingresarlos uno por uno. Debe validar formato, detectar duplicados y mostrar preview antes de importar.

**Criterios de Aceptación:**
- [ ] Acepta archivos .xlsx con columnas: modelo, serie, tipo, año, estado
- [ ] Valida que todos los campos requeridos estén presentes
- [ ] Detecta y alerta sobre números de serie duplicados
- [ ] Muestra preview de 5 primeros registros antes de confirmar
- [ ] Importa máximo 100 equipos por archivo
- [ ] Maneja errores y muestra qué filas fallaron
- [ ] Genera log descargable de la importación

**Puntaje de Priorización:**
- Valor_Negocio: 8 (cliente lo pidió)
- Urgencia: 5 (puede esperar 1 semana)
- Complejidad: 6 (mediana)
- **Puntaje:** (8*3) + (5*2) - (6*0.5) = 24 + 10 - 3 = **31 → 🔴 Alta**

*Nota: Aunque empezó como 🟡 Media, el puntaje sugiere 🔴 Alta. Mantener en 🟡 porque hay tareas de seguridad más críticas en el sprint.*

**Subtareas:**
1. [x] Spike: Evaluar librerías (SheetJS vs ExcelJS) - 1h
2. [ ] Implementar parser de Excel - 2h
3. [ ] Crear validaciones de negocio - 1.5h
4. [ ] UI de upload y preview - 2h
5. [ ] Batch insert a Firestore - 1h
6. [ ] Tests unitarios e integración - 1.5h
7. [ ] Documentación de uso - 0.5h

**Notas Técnicas:**
- Usar `xlsx` library (lighter than ExcelJS)
- Limitar a 100 rows para evitar timeout de Firestore batch
- Para >100, implementar chunking en futuro sprint
```

---

### Ejemplo 2: Bug Crítico

```markdown
### [BUG-012] Error al calcular total de renta con descuento

**Metadatos:**
- 🎯 **Prioridad:** 🔴 Alta
- ⏱️ **Estimación:** 2h 15m
  - Base: S (2h)
  - Complejidad: Baja (x1.0) - lógica simple
  - Experiencia: Experto (x0.8)
  - Buffer: x1.2
  - Cálculo: 2 * 1.0 * 0.8 * 1.2 = 1.92h → 2h 15m
- 👤 **Asignado:** GEMINI
- 📦 **Sprint:** Sprint 2 (Hotfix)
- 🏷️ **Tags:** `#bug` `#critical` `#rentas` `#cálculo`
- 🔗 **Dependencias:** Ninguna
- 🚧 **Bloqueadores:** Ninguno
- 📅 **Deadline:** 2025-11-09 EOD (Crítico - afecta facturación)
- 💰 **Valor de Negocio:** Alto (impacta dinero)
- 🔧 **Complejidad Técnica:** Baja

**Descripción:**
Cuando se aplica un descuento porcentual a una renta, el total calculado es incorrecto. El sistema suma el descuento en lugar de restarlo.

**Reporte del Usuario:**
```
Renta ID: R-2024-089
Subtotal: $1,200.00
Descuento: 10%
Total esperado: $1,080.00
Total mostrado: $1,320.00 ❌
```

**Causa Raíz:**
En `apps/web/src/lib/calculations.ts:45` se usa `+` en lugar de `-`:
```typescript
// Código incorrecto
const total = subtotal + (subtotal * discount / 100);
```

**Solución:**
```typescript
// Código correcto
const total = subtotal - (subtotal * discount / 100);
```

**Criterios de Aceptación:**
- [x] Fix aplicado en `calculations.ts`
- [ ] Test unitario que reproduce el bug
- [ ] Test pasando con el fix
- [ ] Verificación manual con caso del usuario
- [ ] Regression test para rentas existentes
- [ ] Desplegado a producción
- [ ] Notificación a usuario que reportó

**Impacto:**
- 🔴 **Severidad:** Crítica
- 📊 **Usuarios Afectados:** ~15 rentas en producción con descuento
- 💸 **Impacto Financiero:** Potenciales cobros incorrectos

**Plan de Remediación:**
1. Fix inmediato en código
2. Script para recalcular rentas afectadas
3. Notificar a finanzas sobre rentas a ajustar
4. Agregar validación adicional en UI

**Puntaje de Priorización:**
- Valor_Negocio: 10 (afecta dinero directamente)
- Urgencia: 10 (debe arreglarse hoy)
- Complejidad: 2 (fix simple)
- **Puntaje:** (10*3) + (10*2) - (2*0.5) = 30 + 20 - 1 = **49 → 🔴 Alta**
```

---

### Ejemplo 3: Refactor Técnico

```markdown
### [TECH-021] Refactorizar sistema de rutas para usar App Router patterns

**Metadatos:**
- 🎯 **Prioridad:** 🟢 Baja
- ⏱️ **Estimación:** 12h 0m
  - Base: L (12h)
  - Complejidad: Media (x1.5) - migración gradual
  - Experiencia: Medio (x1.0)
  - Buffer: x1.2
  - Cálculo: 12 * 1.5 * 1.0 * 1.2 = 21.6h → Dividir en 2 subtareas
- 👤 **Asignado:** Sin asignar
- 📦 **Sprint:** Backlog (Tech Debt)
- 🏷️ **Tags:** `#refactor` `#nextjs` `#app-router` `#tech-debt`
- 🔗 **Dependencias:** Ninguna (puede hacerse incremental)
- 🚧 **Bloqueadores:** Ninguno
- 📅 **Deadline:** Flexible
- 💰 **Valor de Negocio:** Bajo (interno, no visible al usuario)
- 🔧 **Complejidad Técnica:** Media

**Descripción:**
Migrar rutas actuales que usan patrones legacy a los nuevos patterns de Next.js App Router (Server Components, layouts anidados, loading states).

**Motivación:**
- Mejor performance con Server Components
- Reducir JS enviado al cliente
- Aprovechar streaming y Suspense
- Alinearse con best practices de Next.js 14+

**Alcance:**
- ✅ **Incluido:**
  - Migrar `/clientes`, `/equipos`, `/rentas` a app router
  - Implementar layouts compartidos
  - Convertir componentes apropiados a Server Components
  
- ❌ **Excluido:**
  - Páginas de admin (se hará en Sprint 4)
  - Rutas de auth (requieren análisis separado)

**Criterios de Aceptación:**
- [ ] Todas las rutas migradas funcionan idénticamente
- [ ] Tests E2E pasan sin cambios
- [ ] Bundle size reducido en al menos 15%
- [ ] Lighthouse score mejora +5 puntos
- [ ] Documentación actualizada
- [ ] Cero regresiones en funcionalidad

**Subtareas:**
- [ ] [TECH-021.1] Migrar `/clientes` (4h)
- [ ] [TECH-021.2] Migrar `/equipos` (4h)
- [ ] [TECH-021.3] Migrar `/rentas` (6h)
- [ ] [TECH-021.4] Cleanup y tests (3h)
- [ ] [TECH-021.5] Documentar patterns (2h)

**Puntaje de Priorización:**
- Valor_Negocio: 4 (beneficio técnico, no funcional)
- Urgencia: 2 (nice to have)
- Complejidad: 7 (requiere cuidado para no romper nada)
- **Puntaje:** (4*3) + (2*2) - (7*0.5) = 12 + 4 - 3.5 = **12.5 → 🟢 Baja**

**ROI Estimado:**
- Inversión: 19h desarrollo
- Retorno: -10% bundle, +20% performance percibida, mejor DX
- Tiempo de recuperación: 2-3 sprints (acumulado de velocidad)

**Decisión:**
Mover a backlog. Ejecutar cuando:
1. Haya capacidad sobrante en sprint, O
2. El bundle size se vuelva un problema real, O
3. Next.js deprece patterns actuales
```

---

## 🎯 Algoritmo de Decisión: ¿Qué Tarea Tomar?

```
INICIO
  ↓
¿Hay tareas 🔴 Alta?
  SÍ → ¿Está bloqueada?
    NO → Tomar esa tarea
    SÍ → Documentar bloqueador, siguiente
  NO → ¿Hay tareas 🟡 Media sin dependencias?
    SÍ → Ordenar por: Valor_Negocio * (1 - Complejidad/10)
      → Tomar la de mayor score
    NO → ¿Hay tareas 🟢 Baja quick wins (<2h)?
      SÍ → Tomar esa para mantener momentum
      NO → Revisar bloqueadores o crear nuevas tareas
FIN
```

---

## 📊 Métricas de Priorización

### KPIs a Trackear

1. **Velocidad por Prioridad:**
   - 🔴 Promedio de resolución: <48h
   - 🟡 Promedio de resolución: 3-5 días
   - 🟢 Promedio de resolución: Variable

2. **Distribución de Trabajo:**
   - Ideal: 30% 🔴 / 50% 🟡 / 20% 🟢
   - Si >60% 🔴: Hay problemas de planificación

3. **Precisión de Estimaciones:**
   - Tracking: Estimado vs Real
   - Objetivo: ±20% de precisión
   - Revisar factores si desviación >30%

4. **Tasa de Re-priorización:**
   - % de tareas que cambian de prioridad
   - Alta tasa indica requisitos volátiles

### Dashboard Example

```markdown
## 📊 Sprint 3 - Métricas de Priorización

| Métrica | Valor | Status |
|---------|-------|--------|
| Tareas 🔴 completadas | 4/5 | ✅ 80% |
| Tareas 🟡 completadas | 8/12 | ⚠️ 67% |
| Tareas 🟢 completadas | 2/8 | ✅ 25% (esperado) |
| Promedio resolución 🔴 | 28h | ✅ <48h |
| Precisión estimaciones | +15% | ✅ <20% |
| Bloqueadores activos | 2 | ⚠️ Monitorear |
| Re-priorizaciones | 3 | ✅ <5 |
```

---

## 🔄 Revisión y Ajuste

**Frecuencia:**
- **Diaria:** Revisar 🔴 Alta (en handoffs)
- **Semanal:** Re-priorizar 🟡 Media según progreso
- **Quincenal:** Grooming de 🟢 Baja y backlog
- **Mensual:** Revisar y ajustar criterios de priorización

**Señales para Ajustar Sistema:**
- Estimaciones consistentemente off por >30%
- Bloqueadores frecuentes del mismo tipo
- Quejas de stakeholders sobre priorización
- Burnout del equipo (demasiado 🔴)

---

**Versión:** 1.0
**Última Actualización:** 2025-11-08
**Mantenido por:** Metodología INTEGRA
