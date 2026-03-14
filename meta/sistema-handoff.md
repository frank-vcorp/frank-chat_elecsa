# Sistema de Handoff - Metodología INTEGRA

## 🎯 Objetivo

Establecer un protocolo claro y consistente para la transferencia de trabajo entre agentes (SOFIA, CODEX, GEMINI) que garantice continuidad, contexto completo y cero pérdida de información.

---

## 🤝 Principios Fundamentales

### 1. Claridad sobre Brevedad

Un handoff debe ser tan detallado como sea necesario para que el siguiente agente pueda continuar sin necesidad de investigación adicional.

### 2. Contexto Completo

Incluir no solo QUÉ se hizo, sino también POR QUÉ se tomaron ciertas decisiones y QUÉ alternativas se descartaron.

### 3. Trazabilidad

Cada handoff debe quedar documentado en PROYECTO.md y/o en el checkpoint correspondiente.

### 4. Responsabilidad Compartida

- **Agente que entrega:** Responsable de documentar completamente
- **Agente que recibe:** Responsable de confirmar comprensión antes de empezar

### 5. Formato Consistente

Usar siempre el template de handoff para facilitar parsing y comprensión rápida.

---

## 📋 Template de Handoff

### Formato Completo

````markdown
## 🤝 Handoff: [AGENTE_ORIGEN] → [AGENTE_DESTINO]

**Fecha:** YYYY-MM-DD HH:mm
**Tarea:** [ID] Nombre de la Tarea
**Estado de la Tarea:** [% completado, ej: 60%]

---

### 📍 Contexto

**Objetivo Original:**
[Cuál es el objetivo final de esta tarea]

**Alcance:**

- ✅ **Completado hasta ahora:**
  - [Item 1 terminado]
  - [Item 2 terminado]
- 🚧 **En progreso:**
  - [Item parcialmente hecho - detallar qué falta]
- ⏳ **Pendiente:**
  - [Item no iniciado 1]
  - [Item no iniciado 2]

---

### 💼 Trabajo Realizado

**Archivos Creados:**

- `path/to/file1.ts` - [Propósito]
- `path/to/file2.tsx` - [Propósito]

**Archivos Modificados:**

- `path/to/file3.ts` (líneas 45-78) - [Qué se cambió]
- `path/to/file4.tsx` (líneas 120-135) - [Qué se cambió]

**Archivos Eliminados:**

- `path/to/old-file.ts` - [Razón de eliminación]

**Comandos Ejecutados:**

```bash
pnpm install package-name
pnpm run test
```
````

**Tests:**

- [x] Unit tests para módulo X: ✅ Pasan
- [ ] Integration tests: ⏳ Pendientes
- [x] Lint: ✅ Sin errores

---

### 🎯 Próximos Pasos

**Para [AGENTE_DESTINO]:**

1. **[Paso 1 - Acción específica]**
   - Contexto: [Por qué es necesario]
   - Input: [Qué necesita usar/leer]
   - Output esperado: [Qué debe producir]
   - Tiempo estimado: [Xh]

2. **[Paso 2 - Acción específica]**
   - Contexto: [...]
   - Input: [...]
   - Output esperado: [...]
   - Tiempo estimado: [Yh]

3. **[Paso 3 - Acción específica]**
   - [...]

**Prioridad de los pasos:** [1 > 2 > 3 o especificar si pueden paralelizarse]

---

### 🔑 Decisiones Técnicas

**Decisiones Tomadas:**

- **[Decisión 1]:** [Qué se decidió]
  - Razón: [Por qué]
  - Alternativas descartadas: [Qué más se consideró]
  - Consecuencias: [Impacto de esta decisión]

- **[Decisión 2]:** [...]

**Decisiones Pendientes (requieren input):**

- ❓ **[Decisión pendiente 1]:** [Qué hay que decidir]
  - Opciones: [A, B, C]
  - Criterio sugerido: [En qué basarse para decidir]

---

### ⚠️ Problemas Encontrados

**Resueltos:**

- ✅ **[Problema 1]:** [Descripción]
  - Solución aplicada: [Cómo se resolvió]
  - Archivos afectados: [Dónde quedó el fix]

**Bloqueadores Activos:**

- 🚧 **[Bloqueador 1]:** [Descripción]
  - Tipo: [Técnico/Información/Recurso]
  - Impacto: [Alto/Medio/Bajo]
  - Workaround: [Si existe]
  - Acción requerida: [Qué hay que hacer para desbloquearlo]

---

### 📚 Recursos y Referencias

**Documentación Consultada:**

- [Link 1 - Título]
- [Link 2 - Título]

**ADRs Relevantes:**

- [ADR-XXX: Título](path/to/adr.md)

**Issues/PRs Relacionados:**

- Issue #XX: [Descripción]
- PR #YY: [Descripción]

**Conversaciones Importantes:**

- [Resumen de cualquier clarificación con stakeholders]

---

### 🧪 Testing y Validación

**Cómo Testear el Trabajo Actual:**

```bash
# Comandos para reproducir el estado actual
pnpm install
pnpm run dev --filter @farianergy/web
# Navegar a: http://localhost:3000/[ruta]
```

**Casos de Prueba Importantes:**

1. [Caso 1 - qué testear y resultado esperado]
2. [Caso 2 - qué testear y resultado esperado]

**Conocidos que NO funcionan aún:**

- ❌ [Funcionalidad X] - Razón: [pendiente de implementar]

---

### 💡 Notas Importantes

**Contexto Adicional:**

- [Cualquier información que no encaje en secciones anteriores pero sea crucial]

**Lecciones Aprendidas:**

- [Aprendizaje 1 - para evitar repetir errores]
- [Aprendizaje 2]

**Sugerencias para el Siguiente Agente:**

- 💡 [Sugerencia 1 - ej: "Considera usar librería X para esto"]
- 💡 [Sugerencia 2]

---

### ✅ Checklist de Entrega

- [ ] PROYECTO.md actualizado con progreso
- [ ] Checkpoint creado (si corresponde)
- [ ] Tests ejecutados y documentados
- [ ] Archivos modificados listados
- [ ] Próximos pasos claros y accionables
- [ ] Bloqueadores documentados
- [ ] Decisiones técnicas registradas

---

**Firma:** [AGENTE_ORIGEN]
**Timestamp:** YYYY-MM-DD HH:mm:ss
**Hash del Último Commit:** [git hash si aplica]

````

---

## 📊 Tipos de Handoff

### 1. Handoff Secuencial (Completar → Continuar)

**Cuándo:** Una tarea se completa parcialmente y otro agente debe continuar.

**Ejemplo:** CODEX implementa API → GEMINI implementa UI que consume la API

**Énfasis:**
- Documentar completamente lo que YA funciona
- Proveer ejemplos de uso de lo implementado
- Especificar contratos (API endpoints, tipos, interfaces)

---

### 2. Handoff de Bloqueo (Esperando → Reanudar)

**Cuándo:** Un bloqueador impide continuar y otro agente debe resolverlo.

**Ejemplo:** GEMINI bloqueado esperando endpoint → SOFIA decide arquitectura → CODEX implementa

**Énfasis:**
- Documentar claramente el bloqueador
- Especificar exactamente qué se necesita para desbloquear
- Preservar contexto para retomar después

---

### 3. Handoff de Revisión (Implementado → Validar)

**Cuándo:** Trabajo completo que requiere revisión antes de marcar como done.

**Ejemplo:** CODEX termina feature → SOFIA revisa arquitectura → GEMINI valida UX

**Énfasis:**
- Listar todos los archivos cambiados
- Proveer comandos para reproducir/testear
- Especificar criterios de aceptación

---

### 4. Handoff de Urgencia (Cambio de Contexto)

**Cuándo:** Aparece tarea de mayor prioridad y hay que cambiar de foco.

**Ejemplo:** GEMINI trabajando en feature → Bug crítico aparece → CODEX debe arreglarlo

**Énfasis:**
- Guardar estado actual claramente
- Documentar qué quedó a medias
- Facilitar retomar después sin pérdida de contexto

---

## 📝 Ejemplos Completos

### Ejemplo 1: SOFIA → GEMINI (Spec completa, implementar UI)

```markdown
## 🤝 Handoff: SOFIA → GEMINI

**Fecha:** 2025-11-08 14:30
**Tarea:** [T-045] Implementar Dashboard de Equipos
**Estado de la Tarea:** 30% completado (spec y wireframes listos)

---

### 📍 Contexto

**Objetivo Original:**
Crear un dashboard que muestre todos los equipos disponibles con filtros por tipo, estado y búsqueda por número de serie.

**Alcance:**
- ✅ **Completado hasta ahora:**
  - Especificación técnica creada (`context/SPEC-DASHBOARD-EQUIPOS.md`)
  - Wireframes en Figma ([link])
  - ADR-015 creado para decisión de usar Server Components

- 🚧 **En progreso:**
  - Nada actualmente

- ⏳ **Pendiente:**
  - Implementación de componentes UI
  - Integración con API `/api/equipos`
  - Tests de componentes

---

### 💼 Trabajo Realizado

**Archivos Creados:**
- `context/SPEC-DASHBOARD-EQUIPOS.md` - Especificación completa
- `metodologia-integra/context/decisions/ADR-015-server-components-dashboard.md`

**Archivos Modificados:**
- `PROYECTO.md` (líneas 234-256) - Agregada tarea T-045 con subtareas

---

### 🎯 Próximos Pasos

**Para GEMINI:**

1. **Crear página del dashboard**
   - Contexto: Necesitamos la ruta `/equipos/dashboard` en Next.js App Router
   - Input: Usar spec en `context/SPEC-DASHBOARD-EQUIPOS.md`
   - Output esperado: `apps/web/src/app/equipos/dashboard/page.tsx`
   - Tiempo estimado: 2h
   - Decisión ya tomada: Usar Server Component para fetch inicial (ver ADR-015)

2. **Implementar componente de tabla de equipos**
   - Contexto: Tabla reusable para mostrar lista con sorting y paginación
   - Input: Datos desde API `/api/equipos` (ya funciona, probado por CODEX)
   - Output esperado: `apps/web/src/components/EquiposTable.tsx`
   - Tiempo estimado: 1.5h
   - Usar Tailwind para estilos, componentes base ya en `components/ui/`

3. **Implementar filtros**
   - Contexto: Sidebar con filtros por tipo, estado y búsqueda
   - Input: Enum de tipos y estados en `context/SPEC-DASHBOARD-EQUIPOS.md`
   - Output esperado: `apps/web/src/components/EquiposFiltros.tsx`
   - Tiempo estimado: 1h
   - Debe ser Client Component para interactividad

**Prioridad:** 1 > 2 > 3 (secuencial, página depende de componentes)

---

### 🔑 Decisiones Técnicas

**Decisiones Tomadas:**
- **Usar Server Components para fetch inicial:**
  - Razón: Reducir JS enviado al cliente, mejor performance
  - Alternativas descartadas: Client Component con useEffect (más lento, peor UX)
  - Consecuencias: Filtros deben ser Client Components separados
  - Documentado en: ADR-015

- **Paginación server-side:**
  - Razón: La tabla de equipos puede crecer a 1000+ items
  - Alternativas descartadas: Paginación client-side (no escala)
  - Consecuencias: API debe soportar `?page=X&limit=Y` (ya implementado por CODEX)

**Decisiones Pendientes:**
- ❓ **¿Usar tabla custom o librería?**
  - Opciones: Custom Tailwind table vs TanStack Table vs shadcn/ui Table
  - Criterio sugerido: Si necesitas sorting complejo → TanStack, sino custom
  - Mi recomendación: Custom simple primero, refactor después si se necesita

---

### ⚠️ Problemas Encontrados

**Resueltos:**
- ✅ **Tipos TypeScript para Equipo no existían:**
  - Solución aplicada: Creados en `apps/web/src/types/equipos.ts`
  - Archivos afectados: Tipos compartidos ahora disponibles

**Bloqueadores Activos:**
- Ninguno

---

### 📚 Recursos y Referencias

**Documentación Consultada:**
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Tailwind Tables](https://tailwindui.com/components/application-ui/lists/tables)

**ADRs Relevantes:**
- [ADR-015: Server Components para Dashboard](metodologia-integra/context/decisions/ADR-015-server-components-dashboard.md)

**API Endpoints Disponibles:**
- `GET /api/equipos` - Lista todos los equipos
  - Params: `?tipo=X&estado=Y&search=Z&page=N&limit=M`
  - Response: `{ data: Equipo[], total: number, page: number }`
- `GET /api/equipos/[id]` - Detalle de un equipo

---

### 🧪 Testing y Validación

**Cómo Testear la API (ya funciona):**
```bash
# Levantar dev server
pnpm run dev --filter @farianergy/web

# Probar endpoint
curl http://localhost:3000/api/equipos
curl http://localhost:3000/api/equipos?tipo=generador&estado=disponible
````

**Casos de Prueba para la UI:**

1. Al cargar `/equipos/dashboard` → Debe mostrar todos los equipos
2. Al filtrar por tipo "Generador" → Solo muestra generadores
3. Al buscar por serie "GEN-001" → Solo muestra ese equipo
4. Al cambiar de página → Carga siguiente set de 20 items

---

### 💡 Notas Importantes

**Contexto Adicional:**

- El cliente usa este dashboard diariamente, performance es crítico
- Equipos tienen fotos en Firebase Storage, considerar lazy loading
- Mobile responsive es importante (60% del uso es en tablets)

**Sugerencias para GEMINI:**

- 💡 Usa `loading.tsx` en la carpeta para mostrar skeleton mientras carga
- 💡 Los iconos de tipo de equipo están en `components/icons/EquipoIcons.tsx`
- 💡 Para imágenes, wrapper `<EquipoImage />` ya maneja Storage URLs

---

### ✅ Checklist de Entrega

- [x] PROYECTO.md actualizado con progreso
- [x] Checkpoint creado (`Checkpoints/CHK_2025-11-08_1430.md`)
- [x] Spec técnica completa
- [x] ADR creado para decisión arquitectónica
- [x] API endpoints verificados (funcionan)
- [x] Próximos pasos claros y accionables
- [x] Tipos TypeScript creados

---

**Firma:** SOFIA
**Timestamp:** 2025-11-08 14:30:00

````

---

### Ejemplo 2: GEMINI → CODEX (Bug encontrado, necesita fix backend)

```markdown
## 🤝 Handoff: GEMINI → CODEX

**Fecha:** 2025-11-08 16:45
**Tarea:** [BUG-023] Fix cálculo de fechas de vencimiento en rentas
**Estado de la Tarea:** 20% (bug identificado y reproducido)

---

### 📍 Contexto

**Objetivo Original:**
Los usuarios reportan que las fechas de vencimiento de pago en rentas están incorrectas (aparecen 1 día antes de lo esperado).

**Alcance:**
- ✅ **Completado hasta ahora:**
  - Bug reproducido localmente
  - Causa raíz identificada (zona horaria UTC vs local)
  - Casos de prueba documentados

- ⏳ **Pendiente:**
  - Fix en backend (cálculo de fechas)
  - Tests unitarios para prevenir regresión
  - Verificación en UI

---

### 💼 Trabajo Realizado

**Investigación:**
- Reproduje bug en `/rentas/[id]` con renta ID `R-2024-089`
- Identifiqué que el problema está en `apps/web/src/app/api/rentas/route.ts`
- El cálculo usa `new Date()` sin considerar timezone de México

**Archivos Afectados (sin modificar aún):**
- `apps/web/src/app/api/rentas/route.ts` - Donde está el bug

---

### 🎯 Próximos Pasos

**Para CODEX:**

1. **Fix cálculo de fechas en API**
   - Contexto: Fechas se calculan en UTC pero deben ser en timezone de México (America/Mexico_City)
   - Input: Función `calculateFechaVencimiento()` en línea 67 de `route.ts`
   - Output esperado: Fecha correcta en timezone local
   - Tiempo estimado: 1h
   - Solución sugerida: Usar `date-fns-tz` o `luxon` con timezone explícito

2. **Agregar tests unitarios**
   - Contexto: Este bug debe tener test para no volver a ocurrir
   - Input: Casos en sección "Testing" abajo
   - Output esperado: `apps/web/src/app/api/rentas/route.test.ts`
   - Tiempo estimado: 1h

3. **Actualizar rentas existentes (script)**
   - Contexto: Hay ~15 rentas en prod con fecha incorrecta
   - Output esperado: Script one-time en `scripts/fix-rentas-dates.ts`
   - Tiempo estimado: 0.5h

---

### 🔑 Decisiones Técnicas

**Decisiones Pendientes:**
- ❓ **¿Qué librería usar para timezones?**
  - Opciones:
    - A) `date-fns-tz` (ya usamos date-fns)
    - B) `luxon` (más completo pero nuevo)
    - C) Nativo con Intl API (sin deps)
  - Criterio: Mantener consistencia (ya usamos date-fns en otros lugares)
  - Recomendación: Opción A (`date-fns-tz`)

---

### ⚠️ Problemas Encontrados

**Bug Identificado:**
- 🐛 **Cálculo de fecha usa UTC en lugar de timezone local**
  - Ubicación: `apps/web/src/app/api/rentas/route.ts:67`
  - Código problemático:
    ```typescript
    // ❌ INCORRECTO (usa UTC)
    const fechaVencimiento = new Date(fechaInicio);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + diasRenta);
    ```
  - Fix sugerido:
    ```typescript
    // ✅ CORRECTO (usa timezone de México)
    import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
    const timezone = 'America/Mexico_City';
    const fechaLocal = utcToZonedTime(fechaInicio, timezone);
    const fechaVencimiento = addDays(fechaLocal, diasRenta);
    ```

---

### 🧪 Testing y Validación

**Casos de Prueba para Tests Unitarios:**

```typescript
describe('calculateFechaVencimiento', () => {
  it('debe calcular fecha correcta en timezone de México', () => {
    const fechaInicio = '2025-11-08T00:00:00.000Z';
    const diasRenta = 30;
    const resultado = calculateFechaVencimiento(fechaInicio, diasRenta);
    // Debe ser 2025-12-08 en timezone Mexico_City, no UTC
    expect(resultado).toBe('2025-12-08T06:00:00.000Z'); // 00:00 CDST = 06:00 UTC
  });

  it('debe manejar cambio de horario de verano', () => {
    // Caso edge: durante transición DST
    const fechaInicio = '2025-03-08T00:00:00.000Z'; // Antes de DST
    const diasRenta = 10;
    const resultado = calculateFechaVencimiento(fechaInicio, diasRenta);
    // Verificar que considera el cambio de horario
  });
});
````

**Validación Manual:**

```bash
# Después del fix, probar estos casos:
curl -X POST http://localhost:3000/api/rentas \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": "CLI-001",
    "equipoId": "EQ-001",
    "fechaInicio": "2025-11-08",
    "diasRenta": 30
  }'

# Verificar que fechaVencimiento en response sea 2025-12-08
```

---

### 💡 Notas Importantes

**Impacto:**

- 🔴 Alta prioridad: Afecta facturación
- 📊 ~15 rentas en producción necesitan corrección
- 💰 Posibles cobros incorrectos si no se arregla pronto

**Contexto de Negocio:**

- Cliente factura mensualmente basado en estas fechas
- Error de 1 día puede causar confusión en facturación
- Importante comunicar a finanzas cuando se corrija

---

### ✅ Checklist de Entrega

- [x] Bug reproducido y documentado
- [x] Causa raíz identificada
- [x] Casos de prueba definidos
- [x] Solución sugerida (date-fns-tz)
- [x] PROYECTO.md actualizado con tarea BUG-023
- [ ] Fix implementado (pendiente CODEX)
- [ ] Tests agregados (pendiente CODEX)

---

**Firma:** GEMINI
**Timestamp:** 2025-11-08 16:45:00

````

---

### Ejemplo 3: CODEX → SOFIA (Necesita decisión arquitectónica)

```markdown
## 🤝 Handoff: CODEX → SOFIA

**Fecha:** 2025-11-08 10:20
**Tarea:** [T-067] Implementar Sistema de Notificaciones
**Estado de la Tarea:** Bloqueado al 10% (investigación completa, necesita decisión)

---

### 📍 Contexto

**Objetivo Original:**
Implementar sistema de notificaciones para alertar a usuarios sobre:
- Rentas próximas a vencer (3 días antes)
- Mantenimientos programados
- Pagos recibidos

**Alcance:**
- ✅ **Completado:**
  - Investigación de opciones (Firebase FCM, SendGrid, Twilio)
  - Spike técnico de FCM (funciona, PoC en branch `spike/fcm`)
  - Documento de comparación de opciones

- 🚧 **Bloqueado:**
  - Decisión sobre arquitectura (push vs email vs ambos)
  - Decisión sobre cuándo/cómo enviar notificaciones
  - Aprobación de costos (SendGrid ~$15/mes para volumen esperado)

---

### 💼 Trabajo Realizado

**Archivos Creados:**
- `docs/investigacion-notificaciones.md` - Comparación de opciones
- `spike/fcm-poc/` - Proof of concept (branch separado)

**Investigación:**
- ✅ FCM: Gratis, bueno para push mobile/web, requiere permisos de usuario
- ✅ SendGrid: $15/mes plan básico, 100 emails/día, buena deliverability
- ✅ Twilio: $1 por 1000 emails, más caro pero más features

---

### 🎯 Próximos Pasos

**Para SOFIA:**

1. **Decidir estrategia de notificaciones**
   - Opciones:
     - A) Solo push notifications (FCM) - Gratis pero usuarios deben dar permiso
     - B) Solo emails (SendGrid) - Más confiable pero costo mensual
     - C) Ambos (hybrid) - Mejor UX pero más complejo
   - Contexto: Cliente no especificó preferencia
   - Acción: Consultar con cliente o decidir basado en mejores prácticas

2. **Definir triggers y timing**
   - Decisiones necesarias:
     - ¿Cuántos días antes notificar vencimiento de renta? (3, 5, 7?)
     - ¿Notificar inmediatamente al recibir pago o batch diario?
     - ¿Permitir usuarios configurar sus preferencias?
   - Acción: Crear spec técnica con estas decisiones

3. **Aprobar costos**
   - Si se elige SendGrid: ~$15-30/mes según volumen
   - Si se elige Twilio: ~$20-50/mes
   - FCM: $0
   - Acción: Obtener aprobación de presupuesto

4. **Crear ADR**
   - Una vez decidido, documentar en ADR-XXX
   - Incluir comparación de opciones, costos, pros/contras

---

### 🔑 Decisiones Técnicas

**Decisiones Tomadas:**
- **Usar Firebase Cloud Functions para triggers:**
  - Razón: Ya usamos Firebase, integración natural
  - Alternativa descartada: Cron jobs custom (más mantenimiento)

**Decisiones Pendientes (BLOQUEADOR):**
- ❓ **Estrategia de notificaciones:**
  - Necesito que SOFIA decida: Push vs Email vs Hybrid
  - Bloqueado hasta tener esta decisión

- ❓ **Frecuencia y timing:**
  - ¿Cuándo notificar? (inmediato, batch, scheduled)
  - ¿Cuántos recordatorios? (uno, varios)

---

### ⚠️ Problemas Encontrados

**Bloqueador Activo:**
- 🚧 **Falta definición de requisitos:**
  - Tipo: Información
  - Impacto: Alto (no puedo continuar implementación)
  - Acción requerida: SOFIA debe consultar cliente o definir spec
  - Workaround: Ninguno, es decisión de negocio

---

### 📚 Recursos y Referencias

**Documentación Consultada:**
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [SendGrid Pricing](https://sendgrid.com/pricing/)
- [Twilio SendGrid vs Twilio Email](https://www.twilio.com/docs/sendgrid)

**Archivos de Investigación:**
- `docs/investigacion-notificaciones.md` - Comparación detallada

**Branch con PoC:**
- `spike/fcm-poc` - Proof of concept de FCM funcionando

---

### 💡 Notas Importantes

**Mi Recomendación:**
- Para MVP: Solo emails con SendGrid ($15/mes es asumible)
- Para v2: Agregar push notifications como opt-in
- Razón: Emails son más confiables y no requieren permisos

**Consideraciones:**
- Push notifications requieren HTTPS y permisos del usuario
- ~30% de usuarios bloquean notificaciones web
- Emails tienen ~95% deliverability con SendGrid

---

### ✅ Checklist de Entrega

- [x] Investigación completa
- [x] PoC técnico funcionando
- [x] Documento de comparación
- [x] PROYECTO.md actualizado con bloqueador
- [ ] Decisión de arquitectura (pendiente SOFIA)
- [ ] Spec técnica (pendiente SOFIA)
- [ ] ADR creado (pendiente post-decisión)

---

**Firma:** CODEX
**Timestamp:** 2025-11-08 10:20:00
**Decisión requerida de:** SOFIA
**Bloqueador hasta:** Decisión de estrategia de notificaciones
````

---

## ✅ Checklist de Handoff

Antes de entregar, verificar:

### Documentación

- [ ] Template de handoff completo
- [ ] Todos los archivos modificados listados
- [ ] Decisiones técnicas documentadas
- [ ] Bloqueadores claramente identificados

### Contexto

- [ ] Objetivo original claro
- [ ] Trabajo completado detallado
- [ ] Próximos pasos accionables
- [ ] Referencias y recursos incluidos

### Trazabilidad

- [ ] PROYECTO.md actualizado
- [ ] Checkpoint creado (si >2h trabajo)
- [ ] ADRs creados/referenciados
- [ ] Commits con mensajes descriptivos

### Testing

- [ ] Tests ejecutados y resultados documentados
- [ ] Comandos para reproducir incluidos
- [ ] Casos de prueba especificados

### Entrega

- [ ] Handoff documentado en PROYECTO.md
- [ ] Siguiente agente notificado
- [ ] Tiempo estimado para próximos pasos
- [ ] Prioridad claramente indicada

---

## 🔄 Ubicación del Handoff

Los handoffs se documentan en **dos lugares**:

### 1. PROYECTO.md (Principal)

Agregar sección al final de la tarea:

```markdown
### [T-045] Implementar Dashboard

[... descripción de la tarea ...]

---

#### 🤝 Handoff History

**2025-11-08 14:30 | SOFIA → GEMINI**

- Completado: Spec y wireframes
- Siguiente: Implementar UI
- Ver: `Checkpoints/CHK_2025-11-08_1430.md` para detalles

**2025-11-09 10:15 | GEMINI → CODEX**

- Completado: UI implementado
- Siguiente: Optimizar queries de la API
- Ver: `Checkpoints/CHK_2025-11-09_1015.md`
```

### 2. Checkpoint (Detallado)

El checkpoint correspondiente contiene el handoff completo con todos los detalles.

---

## 📊 Métricas de Calidad de Handoff

Un handoff de calidad debe permitir al siguiente agente:

- ✅ **Entender en <5 min** qué se hizo y qué falta
- ✅ **Empezar a trabajar en <10 min** sin necesidad de investigación adicional
- ✅ **Reproducir el estado actual** con los comandos provistos
- ✅ **Tomar decisiones informadas** con el contexto dado
- ✅ **Evitar re-trabajo** al conocer decisiones ya tomadas

---

## 🚨 Anti-Patrones (Qué NO Hacer)

### ❌ Handoff Vago

```markdown
## Handoff: CODEX → GEMINI

Implementé la API de equipos. Ahora haz la UI.

Archivos: algunos en /api/
```

**Problema:** Falta contexto, archivos específicos, próximos pasos, decisiones.

---

### ❌ Handoff Sin Contexto

```markdown
## Handoff: SOFIA → CODEX

Crear endpoint POST /api/clientes
```

**Problema:** No dice por qué, qué debe hacer exactamente, qué validaciones, etc.

---

### ❌ Handoff con Decisiones No Documentadas

```markdown
## Handoff: GEMINI → CODEX

Implementé el componente pero usé Zustand en lugar de Context API.
Ahora sigue tú.
```

**Problema:** Decisión técnica importante no justificada ni documentada en ADR.

---

## 🎓 Mejores Prácticas

1. **Ser generoso con el contexto:** Más es mejor que menos
2. **Incluir siempre ejemplos:** Comandos, casos de prueba, código
3. **Documentar el "por qué":** No solo qué se hizo, sino por qué así
4. **Anticipar preguntas:** Si tú te preguntarías algo, documéntalo
5. **Facilitar reproducción:** Comandos copy-paste que funcionen
6. **Ser honesto:** Si algo no funciona, decirlo claramente
7. **Proveer contexto de negocio:** No solo técnico

---

**Versión:** 1.0
**Última Actualización:** 2025-11-08
**Mantenido por:** Metodología INTEGRA
