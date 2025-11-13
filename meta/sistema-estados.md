# Sistema de Estados de Tareas

**Versión:** 1.0  
**Proyecto:** Metodología Integra Evolucionada  
**Última actualización:** 2025-11-08

---

## Flujo de Estados

```
[ ] Pendiente
  ↓
[~] Planificado
  ↓
[/] En Progreso
  ↓
[V] En Validación
  ↓
[R] En Revisión
  ↓
[✓] Completado
  ↓
[X] Aprobado
```

---

## Definición de Estados

### [ ] Pendiente
**Descripción:** Tarea identificada pero no iniciada.  
**Responsable:** Ninguno asignado  
**Acciones permitidas:**
- CODEX puede mover a `[~]` al generar SPEC
- Puede marcar como `[!]` si detecta bloqueador
- Puede marcar como `[?]` si necesita clarificación

**Ejemplo:**
```markdown
- [ ] Implementación de notificaciones push
```

---

### [~] Planificado
**Descripción:** SPEC generado, arquitectura definida, lista para ejecutar.  
**Responsable:** CODEX  
**Requisitos para este estado:**
- [x] SPEC creado (context/SPEC-XXX.md o meta/SPEC-XXX.md)
- [x] Dependencias identificadas
- [x] Estimación de tiempo realizada
- [x] Agente asignado

**Acciones permitidas:**
- SOFIA puede mover a `[/]` al iniciar implementación
- CODEX puede volver a `[ ]` si el SPEC es rechazado

**Ejemplo:**
```markdown
- [~] Implementación de notificaciones push
  **Meta:**
  - Agente: SOFIA
  - Estimación: 6-8 horas
  - Dependencias: [✓] Firebase Cloud Messaging configurado
  - SPEC: context/SPEC-NOTIFICACIONES.md
```

---

### [/] En Progreso
**Descripción:** Agente ejecutando activamente la tarea.  
**Responsable:** SOFIA (principalmente)  
**Requisitos para este estado:**
- [x] Agente identificado trabajando
- [x] Comenzó a modificar archivos o escribir código

**Acciones permitidas:**
- SOFIA mueve a `[V]` al completar implementación
- Puede volver a `[~]` si encuentra bloqueador crítico
- Puede marcar como `[!]` si se bloquea
- Puede marcar como `[?]` si necesita clarificación

**Ejemplo:**
```markdown
- [/] Implementación de notificaciones push
  **En progreso desde:** 2025-11-08 14:30
  **Agente:** SOFIA (ChatGPT API)
  **Avance:** 60% (3/5 subtareas completadas)
```

---

### [V] En Validación
**Descripción:** Código implementado, ejecutando tests y validaciones técnicas.  
**Responsable:** SOFIA (ejecuta) + herramientas automatizadas  
**Requisitos para este estado:**
- [x] Código compilable (TypeScript sin errores)
- [x] ESLint corriendo
- [x] Tests ejecutándose

**Validaciones que se ejecutan:**
- Compilación TypeScript
- Linter (ESLint)
- Tests unitarios (Vitest)
- Tests de integración (si aplica)
- Type checking

**Acciones permitidas:**
- SOFIA mueve a `[R]` si todas las validaciones pasan
- SOFIA vuelve a `[/]` si hay errores y corrige

**Ejemplo:**
```markdown
- [V] Implementación de notificaciones push
  **Validaciones:**
  - [✓] TypeScript compila sin errores
  - [✓] ESLint pasa (0 errores, 2 warnings)
  - [/] Tests unitarios corriendo (12/15 pasados)
  - [ ] Tests de integración (pendiente)
```

---

### [R] En Revisión
**Descripción:** Código validado técnicamente, esperando auditoría de calidad.  
**Responsable:** GEMINI (Gemini Code Assist)  
**Requisitos para este estado:**
- [x] Estado `[V]` completado exitosamente
- [x] Todos los tests pasando
- [x] No hay errores de compilación o linting

**Checklist de Revisión (GEMINI):**
- [ ] Cumple convenciones de SPEC-CODIGO.md
- [ ] Sin comentarios innecesarios o desactualizados
- [ ] Manejo de errores apropiado
- [ ] Sin vulnerabilidades de seguridad obvias
- [ ] Sin código duplicado o dead code
- [ ] Performance aceptable
- [ ] Documentación mínima presente

**Acciones permitidas:**
- GEMINI mueve a `[✓]` si aprueba la revisión
- GEMINI vuelve a `[/]` con comentarios de mejora si rechaza
- GEMINI puede solicitar cambios menores sin volver a `[/]`

**Ejemplo:**
```markdown
- [R] Implementación de notificaciones push
  **Revisor:** GEMINI
  **Fecha inicio revisión:** 2025-11-08 16:45
  **Archivos a revisar:**
  - apps/web/src/lib/notifications.ts
  - apps/web/src/app/api/notifications/route.ts
  - packages/core/src/types.ts (modificado)
  
  **Comentarios de revisión:**
  - ⚠️ Falta manejo de error en línea 45 de notifications.ts
  - ✅ Estructura y tipado correctos
  - ✅ Tests con buena cobertura (85%)
```

---

### [✓] Completado
**Descripción:** Tarea completada, tests pasando, código revisado y aprobado.  
**Responsable:** GEMINI (marca este estado tras aprobar)  
**Requisitos para este estado:**
- [x] Todos los Soft Gates pasados (compilación, tests, revisión, docs)
- [x] GEMINI aprobó la revisión de código
- [x] Documentación actualizada
- [x] Checkpoint generado (CHK_YYYY-MM-DD_HHMM.md)

**Acciones permitidas:**
- CODEX mueve a `[X]` tras validación de Frank
- Solo Frank puede aprobar finalmente
- No se puede volver atrás sin justificación en Checkpoint

**Ejemplo:**
```markdown
- [✓] Implementación de notificaciones push
  **Completado:** 2025-11-08 17:30
  **Agente principal:** SOFIA
  **Revisor:** GEMINI
  **Gates:** ✓ Compilación | ✓ Tests | ✓ Revisión | ✓ Docs
  **Checkpoint:** Checkpoints/CHK_2025-11-08_1730.md
```

---

### [X] Aprobado
**Descripción:** Tarea aprobada oficialmente por el Director del Proyecto (Frank).  
**Responsable:** Frank Saavedra  
**Requisitos para este estado:**
- [x] Estado `[✓]` completado
- [x] Frank validó el entregable
- [x] Cumple criterios de aceptación del cliente (si aplica)

**Acciones permitidas:**
- Ninguna (estado final)
- Solo se puede reabrir con un nuevo ticket si se detecta bug

**Ejemplo:**
```markdown
- [X] Implementación de notificaciones push
  **Aprobado por:** Frank Saavedra
  **Fecha aprobación:** 2025-11-09 10:00
  **Notas:** Funcionalidad probada en producción, cliente satisfecho
```

---

## Estados Especiales

### [!] Bloqueado
**Descripción:** Tarea bloqueada por dependencias o problemas externos.  
**Responsable:** Cualquier agente puede marcar este estado  
**Cuando usar:**
- Dependencia externa no resuelta
- Decisión de Frank pendiente
- Recurso no disponible (API key, servidor, etc.)
- Bug en librería de terceros

**Acciones requeridas:**
- Documentar bloqueador en nota
- Identificar responsable de desbloqueador
- Estimar tiempo de desbloqueo (si es posible)

**Ejemplo:**
```markdown
- [!] Implementación de notificaciones push
  **Bloqueador:** Firebase Cloud Messaging requiere upgrade de plan
  **Responsable de resolver:** Frank (decisión de negocio)
  **Alternativa temporal:** Notificaciones por email
  **Fecha estimada de resolución:** 2025-11-15
```

---

### [?] Necesita Clarificación
**Descripción:** Requisitos ambiguos o incompletos, requiere input de Frank o cliente.  
**Responsable:** Cualquier agente puede marcar este estado  
**Cuando usar:**
- SPEC incompleto o contradictorio
- Requisito de negocio no claro
- Diseño UX/UI sin definir
- Decisión técnica requiere aprobación de Frank

**Acciones requeridas:**
- Listar preguntas específicas
- Identificar a quién se debe consultar
- Pausar trabajo hasta recibir respuesta

**Ejemplo:**
```markdown
- [?] Implementación de notificaciones push
  **Preguntas pendientes:**
  1. ¿Notificaciones push o in-app o ambas?
  2. ¿Frecuencia máxima permitida por usuario?
  3. ¿Se requiere historial de notificaciones en BD?
  
  **Consultar a:** Frank Saavedra
  **Pausado hasta:** Respuestas recibidas
```

---

## Transiciones de Estado

### Flujo Normal (Happy Path)
```
[ ] → [~] → [/] → [V] → [R] → [✓] → [X]
```

### Flujos con Iteración
```
[/] → [V] → [/]  (tests fallan, SOFIA corrige)
[R] → [/]        (GEMINI rechaza, SOFIA corrige)
[~] → [?]        (SPEC ambiguo, requiere clarificación)
[/] → [!]        (bloqueador detectado)
```

### Transiciones Prohibidas
```
❌ [ ] → [✓]     (no se puede completar sin ejecutar)
❌ [/] → [X]     (no se puede aprobar sin revisión)
❌ [✓] → [/]     (no se puede reabrir sin justificación)
❌ [X] → cualquier estado (estado final)
```

---

## Responsabilidades por Agente

### CODEX (Arquitecto)
- Mueve de `[ ]` a `[~]` (planificación)
- Valida `[✓]` antes de presentar a Frank
- Mueve de `[✓]` a `[X]` tras aprobación de Frank
- Identifica y marca `[!]` bloqueadores
- Marca `[?]` cuando requiere clarificación

### SOFIA (Constructora)
- Mueve de `[~]` a `[/]` (inicia trabajo)
- Mueve de `[/]` a `[V]` (completa implementación)
- Ejecuta validaciones en `[V]`
- Mueve de `[V]` a `[R]` (validaciones pasan)
- Corrige y vuelve a `[/]` si `[V]` o `[R]` fallan

### GEMINI (Revisor)
- Audita código en estado `[R]`
- Mueve de `[R]` a `[✓]` (aprueba revisión)
- Mueve de `[R]` a `[/]` (rechaza con comentarios)
- Verifica cumplimiento de Soft Gates

### FRANK (Director)
- Mueve de `[✓]` a `[X]` (aprobación final)
- Puede mover cualquier tarea a `[?]` o `[!]` si detecta problemas
- Puede solicitar re-trabajo volviendo a `[/]` con justificación

---

## Ejemplos Completos

### Ejemplo 1: Flujo Exitoso
```markdown
## Sprint 2025-11-08

- [X] Implementación de notificaciones push
  **Meta:**
  - Agente: SOFIA
  - Estimación: 6 horas
  - Real: 7.5 horas
  - SPEC: context/SPEC-NOTIFICACIONES.md
  
  **Timeline:**
  - 2025-11-08 09:00 - [ ] Pendiente
  - 2025-11-08 10:00 - [~] CODEX generó SPEC
  - 2025-11-08 11:00 - [/] SOFIA inició implementación
  - 2025-11-08 15:30 - [V] Tests ejecutándose
  - 2025-11-08 16:00 - [R] GEMINI revisando
  - 2025-11-08 17:00 - [✓] Aprobado por GEMINI
  - 2025-11-09 09:00 - [X] Frank aprobó en producción
  
  **Gates:** ✓ Compilación | ✓ Tests (90%) | ✓ Revisión | ✓ Docs
  **Checkpoint:** CHK_2025-11-08_1700.md
```

### Ejemplo 2: Flujo con Bloqueador
```markdown
- [!] Integración con Stripe para pagos
  **Bloqueador:** No tenemos API keys de producción de Stripe
  **Responsable:** Frank (solicitar a cliente)
  **Estado anterior:** [/] En Progreso
  **Trabajo completado:** 40% (implementación en sandbox completa)
  **Reanudar cuando:** API keys disponibles
  **Alternativa:** Continuar con modo test mientras tanto
```

### Ejemplo 3: Flujo con Clarificación
```markdown
- [?] Dashboard de analytics
  **Preguntas:**
  1. ¿Qué métricas específicas mostrar? (usuarios activos, ingresos, conversión)
  2. ¿Período de tiempo default? (últimos 7 días, 30 días, custom)
  3. ¿Requiere exportación a PDF/Excel?
  
  **Consultar a:** Frank + Cliente
  **Email enviado:** 2025-11-08 14:00
  **Pausado hasta:** Respuesta recibida
```

---

## Uso en PROYECTO.md

### Template de Tarea con Estados
```markdown
- [ESTADO] Nombre de la Tarea
  **Meta:** (solo si estado >= [~])
  - Prioridad: 🔴 Alta | 🟡 Media | 🟢 Baja
  - Estimación: X horas
  - Agente: SOFIA | CODEX | GEMINI
  - Dependencias: [✓] Tarea1, [/] Tarea2
  - SPEC: ruta/al/spec.md
  
  **Progreso:** (solo si estado = [/])
  - Avance: X%
  - Tiempo invertido: X horas
  
  **Validaciones:** (solo si estado = [V])
  - [ ] Compilación TypeScript
  - [ ] ESLint
  - [ ] Tests unitarios
  - [ ] Tests integración
  
  **Revisión:** (solo si estado = [R])
  - Revisor: GEMINI
  - Comentarios: [enlace a comentarios]
  
  **Gates:** (solo si estado = [✓])
  - ✓ Compilación | ✓ Tests | ✓ Revisión | ✓ Docs
  
  **Aprobación:** (solo si estado = [X])
  - Aprobado por: Frank Saavedra
  - Fecha: YYYY-MM-DD
  
  **Bloqueador:** (solo si estado = [!])
  - Descripción: ...
  - Responsable: ...
  
  **Clarificación:** (solo si estado = [?])
  - Preguntas: ...
  - Consultar a: ...
```

---

**Versión:** 1.0  
**Autor:** Frank Saavedra  
**IA Colaboradora:** Verdent (Claude Sonnet 4)
