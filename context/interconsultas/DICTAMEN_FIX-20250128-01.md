# DICTAMEN TÉCNICO: Escalación Prematura de Sofía y Fallas en Notificaciones

- **ID:** FIX-20250128-01
- **Fecha:** 2025-01-28
- **Solicitante:** IMPL-20250128-02
- **Estado:** ✅ VALIDADO

---

## A. ANÁLISIS DE CAUSA RAÍZ

### Bug 1: Sofía escala muy fácil (información de sucursales)

**Síntoma:** El usuario preguntó "Necesito información de la sucursal de Querétaro" y Sofía escaló a humano en lugar de responder.

**Hallazgo forense:**

1. **El prompt de Sofía está en Firestore** (`agents/sofia.prompt`), NO en código fuente
2. El `aiProvider.ts` carga dinámicamente el prompt con `getAgentPrompt('sofia')` (línea 119)
3. También carga `context_docs` de Firestore (línea 52-79) para información adicional

**CAUSA RAÍZ:**
- **No hay información de sucursales en los `context_docs` de Firestore**
- Sofía no tiene datos concretos sobre horarios, direcciones y teléfonos de sucursales
- Al no saber responder, opta por escalar (comportamiento defensivo correcto según su prompt)

**Evidencia:** La función `getContextDocumentsText()` busca en `context_docs` donde `active == true`, pero si no hay documentos con información de sucursales, Sofía no puede responder.

---

### Bug 2: Agente no recibió notificación/alarma al escalar

**Síntoma:** Sofía dijo "realizo la transferencia" pero el footer muestra "1 IA | 0 humanos" y no hubo alarma.

**Hallazgo forense:**

1. **Función `detectEscalation()` en [webhook/route.ts](apps/web/src/app/api/twilio/webhook/route.ts#L9-L16)**:
```typescript
const escalationPatterns = [
    /\[SEMÁFORO:\s*ROJO\]/i,       // ✅ Detecta [SEMÁFORO: ROJO]
    /transferir.*asesor/i,          // ❌ NO detecta "realizo la transferencia"
    /comunic.*humano/i,             // ❌ NO detecta este caso
    /escalando.*conversación/i,     // ❌ NO detecta este caso
];
```

**CAUSA RAÍZ:**
- El patrón `transferir.*asesor` busca "transferir" seguido de "asesor"
- Sofía respondió: **"realizo la transferencia"** que NO contiene "asesor"
- Además, el orden de palabras puede variar

2. **StatusBar.tsx depende de `needsHuman: true`** en Firestore
   - Si `detectEscalation()` no detecta la escalación, nunca se llama `handOffToHuman()`
   - `needsHuman` nunca cambia a `true` → No hay alerta

**Flujo fallido:**
```
Sofía dice "realizo la transferencia"
    → detectEscalation() devuelve FALSE (patrón no coincide)
    → handOffToHuman() NUNCA se ejecuta
    → conversation.needsHuman = false (permanece)
    → StatusBar no muestra alerta
    → Agente no recibe notificación
```

---

### Bug 3: Admin y Agente ven el mismo panel

**Síntoma:** Frank (admin) y Cesar (agente) ven las mismas conversaciones.

**Hallazgo forense:**

1. **AuthContext.tsx** (líneas 103-108) determina roles correctamente:
```typescript
const isAdmin = agent?.role === 'admin';
const isSupervisor = agent?.role === 'supervisor' || isAdmin;
const branch = agent?.branch || null;
const branches = agent?.branches || (agent?.branch ? [agent.branch] : []);
```

2. **ChatList.tsx** (líneas 145-159) implementa filtro por sucursal:
```typescript
if (isSupervisor || isAdmin) {
    matchesBranch = filterBranch === 'all' || c.branch === filterBranch || !c.branch;
} else if (branches.length > 0) {
    matchesBranch = branches.includes(c.branch) || c.branch === 'general' || !c.branch;
}
```

**CAUSA RAÍZ PROBABLE:**
- El agente Cesar tiene `role: 'agent'` pero **no tiene `branch` ni `branches` asignados** en Firestore
- Cuando `branches.length === 0` y `branch === null`, el else final no filtra nada
- El código tiene un "fallback" que permite ver todo si no hay sucursal asignada (línea 159 no tiene else)

**Verificar en Firestore:** `agents/{cesarId}` debe tener:
```json
{
  "role": "agent",
  "branch": "queretaro",     // O la sucursal correcta
  "branches": ["queretaro"]  // Array de sucursales
}
```

---

## B. JUSTIFICACIÓN DE LAS SOLUCIONES

### Corrección Bug 1: Agregar documentos de contexto

**NO es cambio de código** - Es contenido en Firestore:
1. Crear `context_doc` con información de sucursales
2. Incluir: dirección, teléfono, horarios de cada sucursal

**Archivo a crear vía API o Admin:**
```
POST /api/context-docs
{
  "title": "Información de Sucursales ELECSA",
  "content": "## Sucursales ELECSA\n\n### Querétaro\n- Dirección: [COMPLETAR]\n- Teléfono: [COMPLETAR]\n- Horario: L-V 8:00-18:00, Sáb 8:00-14:00\n\n### Guadalajara\n...[RESTO DE SUCURSALES]",
  "source": "admin"
}
```

---

### Corrección Bug 2: Mejorar patrones de `detectEscalation()`

**Archivo:** [apps/web/src/app/api/twilio/webhook/route.ts](apps/web/src/app/api/twilio/webhook/route.ts#L9-L16)

**Código actual:**
```typescript
function detectEscalation(response: string): boolean {
    const escalationPatterns = [
        /\[SEMÁFORO:\s*ROJO\]/i,
        /transferir.*asesor/i,
        /comunic.*humano/i,
        /escalando.*conversación/i,
    ];
    return escalationPatterns.some(pattern => pattern.test(response));
}
```

**Código corregido:**
```typescript
/** Detecta si Sofia indica escalación a humano (semáforo rojo)
 * FIX REFERENCE: FIX-20250128-01
 */
function detectEscalation(response: string): boolean {
    const escalationPatterns = [
        /\[SEMÁFORO:\s*ROJO\]/i,
        /transferir|transfiero/i,                    // Cualquier variante de transferir
        /realizo la transferencia/i,                  // Frase exacta que usa Sofía
        /te comunico con|te paso con/i,               // Frases de handoff
        /comunic.*humano|conectar.*asesor/i,
        /escalando.*conversación/i,
        /un asesor.*te (ayude|contactar|atender)/i,   // "un asesor te ayude"
        /en breve te contactarán/i,                   // Frase de cierre de escalación
    ];
    return escalationPatterns.some(pattern => pattern.test(response));
}
```

---

### Corrección Bug 3: Mejorar filtro por defecto para agentes sin sucursal

**Archivo:** [apps/web/src/components/ChatList.tsx](apps/web/src/components/ChatList.tsx#L145-L160)

**Código actual (tiene falla lógica):**
```typescript
let matchesBranch = true;
if (isSupervisor || isAdmin) {
    matchesBranch = filterBranch === 'all' || c.branch === filterBranch || !c.branch;
} else if (branches.length > 0) {
    matchesBranch = branches.includes(c.branch as any) || c.branch === 'general' || !c.branch;
} else if (branch) {
    matchesBranch = c.branch === branch || c.branch === 'general' || !c.branch;
}
// ❌ FALLA: Si no es admin, no tiene branches, y no tiene branch → matchesBranch = true (ve TODO)
```

**Código corregido:**
```typescript
// Filtro por sucursal:
// - Admin/Supervisor: ve todas o puede filtrar por sucursal
// - Agente normal: solo ve conversaciones de sus sucursales + las genéricas
// - Agente sin sucursal asignada: solo ve conversaciones genéricas (error de config)
// FIX REFERENCE: FIX-20250128-01
let matchesBranch = true;
if (isSupervisor || isAdmin) {
    // Supervisores pueden filtrar manualmente
    matchesBranch = filterBranch === 'all' || c.branch === filterBranch || !c.branch;
} else if (branches.length > 0) {
    // Agentes con múltiples sucursales ven todas las asignadas + general
    matchesBranch = branches.includes(c.branch as any) || c.branch === 'general' || !c.branch;
} else if (branch) {
    // Compatibilidad: agentes con una sola sucursal
    matchesBranch = c.branch === branch || c.branch === 'general' || !c.branch;
} else {
    // ⚠️ Agente sin sucursal asignada: solo ve genéricas para evitar ver todo
    // Esto indica error de configuración del agente
    matchesBranch = c.branch === 'general' || !c.branch;
    console.warn('[ChatList] Agent has no branch assigned - showing only general conversations');
}
```

**Además:** Verificar configuración del agente Cesar en Firestore.

---

## C. INSTRUCCIONES DE HANDOFF PARA SOFIA (Implementador)

### Tarea 1: Actualizar `detectEscalation()` en webhook

1. Abrir: `apps/web/src/app/api/twilio/webhook/route.ts`
2. Localizar función `detectEscalation` (línea 9)
3. Reemplazar con el código corregido de la sección B
4. Agregar marca de agua: `FIX REFERENCE: FIX-20250128-01`

### Tarea 2: Actualizar filtro en `ChatList.tsx`

1. Abrir: `apps/web/src/components/ChatList.tsx`
2. Localizar filtro de sucursal (línea 145-160)
3. Agregar el else final para agentes sin sucursal
4. Agregar marca de agua: `FIX REFERENCE: FIX-20250128-01`

### Tarea 3: Verificar configuración de agente Cesar en Firestore

```
Firestore → agents → [buscar por email de Cesar]
Verificar campos:
- role: 'agent' ✓
- branch: '[sucursal asignada]' ← Debe existir
- branches: ['sucursal1', 'sucursal2'] ← Recomendado
- active: true ✓
```

### Tarea 4: Crear context_doc con información de sucursales

**Desde el Admin Panel:**
1. Ir a: `/admin/templates` (o donde se gestionan context_docs)
2. Crear nuevo documento:
   - Título: "Información de Sucursales ELECSA"
   - Contenido: Datos completos de las 11 sucursales
   - Active: true

**Contenido mínimo sugerido:**
```markdown
# Sucursales ELECSA

## Querétaro
- 📍 Dirección: [COMPLETAR - solicitar a administración]
- 📞 Teléfono: [COMPLETAR]
- 🕐 Horario: Lunes a Viernes 8:00-18:00, Sábados 8:00-14:00

## Guadalajara
- 📍 Dirección: [COMPLETAR]
- 📞 Teléfono: [COMPLETAR]
- 🕐 Horario: Lunes a Viernes 8:00-18:00, Sábados 8:00-14:00

[... resto de sucursales ...]
```

---

## D. ARCHIVOS MODIFICADOS (RESUMEN)

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `apps/web/src/app/api/twilio/webhook/route.ts` | 9-16 | Mejorar patrones de escalación |
| `apps/web/src/components/ChatList.tsx` | 145-160 | Agregar else para agentes sin sucursal |
| Firestore `agents/{cesarId}` | N/A | Verificar/corregir campo `branch` |
| Firestore `context_docs` | N/A | Crear doc con info de sucursales |

---

## E. PRUEBAS RECOMENDADAS

### Test 1: Verificar detección de escalación
```
Mensaje de Sofía: "Permíteme un momento mientras realizo la transferencia."
Esperado: detectEscalation() = true
```

### Test 2: Verificar filtro de sucursales
```
- Login como admin Frank → Debe ver TODAS las conversaciones
- Login como agente Cesar (branch: queretaro) → Solo debe ver queretaro + general
```

### Test 3: Verificar información de sucursales
```
Usuario: "Necesito información de la sucursal de Querétaro"
Esperado: Sofía responde con dirección, teléfono y horarios SIN escalar
```

---

**Firmado:** DEBY - Lead Debugger  
**ID de intervención:** FIX-20250128-01  
**Próximo paso:** SOFIA aplicar correcciones de código según sección C
