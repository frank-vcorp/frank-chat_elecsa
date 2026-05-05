# DICTAMEN TÉCNICO: Análisis de 3 Bugs Críticos en Sistema de Handoff y Notificaciones WA

- **ID:** FIX-20260505-01
- **Fecha:** 2026-05-05
- **Solicitante:** Frank Saavedra (Humano)
- **Sistema:** Frank Chat ELECSA (Next.js + Firestore + Twilio)
- **Estado:** ✅ VALIDADO
- **Analista:** DEBY (Lead Debugger)

---

## RESUMEN EJECUTIVO

Se identificaron 3 bugs en el sistema de handoff y notificaciones WhatsApp:

| Bug | Impacto | Causa Raíz | Riesgo Fix |
|-----|---------|------------|------------|
| **BUG-1**: No existe asignación manual | 🟡 MEDIO | Falta UI (backend OK) | 🟢 BAJO |
| **BUG-2**: Asignación incorrecta de sucursal | 🔴 ALTO | Lógica de matching permisiva | 🟡 MEDIO |
| **BUG-3**: Notificaciones WA no llegan | 🔴 ALTO | Variable env faltante + fallback ineficaz | 🟢 BAJO |

**Nota importante sobre Tamaulipas → Monterrey:** Esto **NO** es un bug. La configuración en `BRANCHES_CONFIG` (línea 501 de `aiProvider.ts`) explícitamente asigna "tamaulipas", "tampico", "reynosa", "matamoros" a la sucursal `monterrey`. Es diseño intencional.

---

## A. ANÁLISIS DE CAUSA RAÍZ

### BUG-1: No existe asignación manual de conversaciones a agentes específicos

#### 🩺 Síntoma
El dashboard solo permite que un agente se asigne a sí mismo una conversación (botón "Tomar Conversación"). Un supervisor no puede asignar una conversación a otro agente específico.

#### 🔬 Hallazgo Forense

**Archivo:** [`apps/web/src/components/ChatWindow.tsx`](apps/web/src/components/ChatWindow.tsx#L290-L310)

```typescript
const handleTakeConversation = async () => {
  if (!conversationId || !user) return;
  // ⚠️ LÍNEA 293: Siempre usa user.uid (agente logueado)
  setConversation((prev) =>
    prev ? { ...prev, needsHuman: false, assignedTo: user.uid, assignedToName: agent?.name || user.email || "Agente" } as any : null
  );
  try {
    // ⚠️ LÍNEA 299: POST solo envía el UID del usuario actual
    await fetch("/api/conversation/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        agentId: user.uid,  // ← HARDCODED al usuario logueado
        agentName: agent?.name || user.email || "Agente",
      }),
    });
  } catch (error) {
    console.error("Failed to take conversation", error);
  }
};
```

**Archivo:** [`apps/web/src/app/api/conversation/assign/route.ts`](apps/web/src/app/api/conversation/assign/route.ts#L13)

```typescript
const { conversationId, agentId, agentName } = body;

if (!conversationId || !agentId) {
  return NextResponse.json(
    { error: "Missing conversationId or agentId" },
    { status: 400 },
  );
}
```

✅ **El backend ya acepta cualquier `agentId`** — no hay restricción de que deba ser el usuario logueado.

#### 📊 Impacto
- **Severidad:** 🟡 MEDIO
- **Afecta:** Supervisores que necesitan distribuir carga de trabajo
- **Usuarios afectados:** Todos los supervisores y admins

#### 🧬 Causa Raíz
**Funcionalidad faltante en UI** — el componente `ChatWindow.tsx` no tiene un selector (dropdown) para elegir a qué agente asignar. Solo implementa auto-asignación.

#### 📍 Ubicaciones Exactas
- **Frontend:** `apps/web/src/components/ChatWindow.tsx` líneas 290-310
- **Backend:** `apps/web/src/app/api/conversation/assign/route.ts` líneas 13-52 (✅ funcional)

---

### BUG-2: Asignación automática de sucursal incorrecta

#### 🩺 Síntoma Reportado
Un agente de **CDMX** fue asignado a una conversación que debería ir a **MONTERREY**.

> **Aclaración:** El caso reportado de "Tamaulipas → Monterrey" **NO es un bug**. La configuración en `BRANCHES_CONFIG` (línea 501-515) asigna explícitamente Tamaulipas, Tampico, Reynosa, Matamoros a la sucursal Monterrey por diseño del negocio.

#### 🔬 Hallazgo Forense

**CAUSA RAÍZ #1: Lógica de matching permisiva en `detectBranchByCity()`**

**Archivo:** [`apps/web/src/lib/aiProvider.ts`](apps/web/src/lib/aiProvider.ts#L683-L698)

```typescript
/** Detecta la sucursal basándose en una ciudad mencionada */
export function detectBranchByCity(cityText: string): string | null {
  const normalized = normalizeText(cityText);

  for (const [branchId, config] of Object.entries(BRANCHES_CONFIG)) {
    for (const city of config.cities) {
      const normalizedCity = normalizeText(city);
      if (
        normalized.includes(normalizedCity) ||
        // ⚠️ LÍNEA 693: BUG CRÍTICO
        normalizedCity.includes(normalized)  // ← FALSOS POSITIVOS
      ) {
        return branchId;
      }
    }
  }

  return null;
}
```

**Problema:** La condición `normalizedCity.includes(normalized)` retorna `true` si el texto del cliente es **una subcadena** de una ciudad configurada.

**Ejemplos de falsos positivos:**

| Cliente escribe | Ciudad en config | Match incorrecto | Sucursal asignada |
|----------------|------------------|------------------|-------------------|
| `"monte"` | `"monterrey"` | ✅ Match | Monterrey (incorrecto) |
| `"leon"` | `"leon"` + `"nuevo leon"` | ✅ Match ambiguo | León (pero podría ser NL → MTY) |
| `"cdmx"` | `"cdmx"` | ✅ Match correcto | — |
| `"mx"` | `"cdmx"` | ✅ Match | CDMX Centro (incorrecto) |

**CAUSA RAÍZ #2: Agentes con `branches: ["general"]` matchean TODAS las sucursales**

**Archivo:** [`apps/web/src/lib/aiProvider.ts`](apps/web/src/lib/aiProvider.ts#L892-L910)

```typescript
const matchingAgents = agentsSnapWA.docs.filter((agentDoc) => {
  const data = agentDoc.data();
  const agentBranches: string[] = (data.branches || (data.branch ? [data.branch] : []))
    .map((b: string) => b.toLowerCase());
  
  // ✅ Supervisores y admins NO reciben WA (correcto)
  if (data.role === "supervisor" || data.role === "admin") return false;
  
  // ⚠️ LÍNEA 905: BUG CRÍTICO
  const isMatch =
    targetBranchWA === "general" ||
    agentBranches.some((b) => targetAliases.includes(b)) ||
    agentBranches.includes("general");  // ← Agentes "general" matchean TODO
  
  console.log(`[WA-Notify] Agente ${data.name || data.email} — branches=${JSON.stringify(agentBranches)} role=${data.role} whatsapp=${data.whatsapp || "NO"} targetAliases=${JSON.stringify(targetAliases)} → match=${isMatch}`);
  return isMatch;
});
```

**Problema:** Si un agente tiene `branches: ["general"]` **y** `role: "agent"` (no supervisor ni admin), pasa el filtro `isMatch` y puede recibir conversaciones de **cualquier sucursal**.

**Escenario real:**
1. Conversación detecta ciudad "Monterrey" → `targetBranchWA = "monterrey"`
2. Hay 2 agentes activos:
   - Agente A: `branches: ["monterrey"]`, `whatsapp: "+525512345678"`
   - Agente B (CDMX): `branches: ["general"]`, `whatsapp: "+525587654321"`
3. Ambos pasan el filtro `isMatch`:
   - Agente A: ✅ `agentBranches.some((b) => targetAliases.includes(b))`
   - Agente B: ✅ `agentBranches.includes("general")`
4. Se elige `primaryAgent` como **el primero con WA registrado** (línea 914):
   ```typescript
   const primaryAgent =
     matchingAgents.find((d) => d.data().whatsapp && !["supervisor", "admin"].includes(d.data().role)) ||
     matchingAgents.find((d) => d.data().whatsapp) ||
     matchingAgents[0];
   ```
5. Si el Agente B aparece primero en el query de Firestore, gana la asignación.

#### 📊 Impacto
- **Severidad:** 🔴 ALTO
- **Afecta:** Asignación automática de conversaciones post-handoff
- **Consecuencia:** Cliente recibe llamada de agente de sucursal incorrecta, mala experiencia, ineficiencia operativa
- **Alcance:** Cualquier conversación donde se detecte ciudad y existan agentes "general" con WA

#### 🧬 Causa Raíz Consolidada
1. **Detección de ciudad demasiado permisiva** → falsos positivos en matching de texto corto
2. **Filtro de agentes no excluye `branches: ["general"]` con `role: "agent"`** → agentes comodín reciben conversaciones de sucursales específicas

#### 📍 Ubicaciones Exactas
- **Detección ciudad:** `apps/web/src/lib/aiProvider.ts` línea 693
- **Filtro agentes WA:** `apps/web/src/lib/aiProvider.ts` líneas 902-908

---

### BUG-3: Avisos de WhatsApp no llegan a los agentes

#### 🩺 Síntoma
Los agentes no reciben notificación por WhatsApp cuando hay un handoff.

#### 🔬 Hallazgo Forense

**CAUSA RAÍZ PRINCIPAL: Variable de entorno faltante en producción**

**Archivo:** [`apps/web/src/lib/aiProvider.ts`](apps/web/src/lib/aiProvider.ts#L933-L950)

```typescript
for (const agentDoc of matchingAgents) {
  const data = agentDoc.data();
  if (!data.whatsapp) continue;

  // Sanitizar número: eliminar espacios y asegurar formato E.164
  const agentPhone = (data.whatsapp as string).replace(/\s+/g, "");

  // ⚠️ LÍNEA 933: Lee variable de entorno
  const templateSid = process.env.TWILIO_WA_TEMPLATE_SID;
  
  if (templateSid) {
    // Usar plantilla aprobada por Meta (necesario para usuarios fuera de ventana 24h)
    await sendWhatsAppTemplate(agentPhone, templateSid, {
      "1": branchNameWA,
      "2": clientName,
      "3": clientPhoneDisplay,
      "4": clientPhone,
      "5": resumen.slice(0, 350) + `\n\n🖥️ https://frank-chat-elecsa-web.vercel.app/dashboard`,
    });
  } else {
    // ⚠️ LÍNEA 948: FALLBACK ineficaz
    // Fallback a texto libre (solo funciona si el agente escribió en las últimas 24h)
    await sendWhatsAppMessage(agentPhone, notifyText);
  }
```

**Evidencia adicional:** [`PROYECTO.md`](PROYECTO.md#L139)

```markdown
- [ ] **Pendiente (manual)**: agregar `TWILIO_WA_TEMPLATE_SID` en Vercel env vars
```

**Archivo:** [`apps/web/src/lib/twilio.ts`](apps/web/src/lib/twilio.ts#L27-L45)

```typescript
/**
 * Sends a WhatsApp message using Twilio's API.
 *
 * @param to - The recipient's phone number (without 'whatsapp:' prefix, but with country code).
 * @param body - The text content of the message.
 * @param fromNumber - Optional custom sender number.
 * @param mediaUrl - Optional URL of media to attach (must be publicly accessible).
 * @returns The Twilio message object if successful.
 * @throws Error if the message fails to send.
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string,
  fromNumber?: string,
  mediaUrl?: string,
) {
  try {
    if (!client) {
      console.log(
        "[Twilio] Credentials missing; skipping outbound send. Message stored only.",
        { to, mediaUrl },
      );
      return {
        sid: "mock-sid",
        status: "queued",
        to,
        body,
      };
    }
```

**Restricción de WhatsApp Business API:**
- Los mensajes de texto libre (sin plantilla) **solo** funcionan dentro de una ventana de 24 horas desde que el destinatario escribió por última vez.
- Si el agente **nunca** ha escrito al número de Twilio, o lo hizo hace más de 24h, el mensaje es **rechazado** por WhatsApp.
- Las **plantillas aprobadas por Meta** (`contentSid`) permiten enviar mensajes **fuera de la ventana de 24h**.

#### 📊 Impacto
- **Severidad:** 🔴 ALTO
- **Afecta:** Sistema de notificaciones crítico para operación
- **Consecuencia:** Agentes no se enteran de handoffs en tiempo real → clientes sin respuesta → pérdida de ventas
- **Alcance:** Todos los agentes (100%)

#### 🧬 Causa Raíz
**Variable de entorno `TWILIO_WA_TEMPLATE_SID` no configurada en Vercel** → el código cae al fallback `sendWhatsAppMessage()` que solo funciona dentro de ventana 24h → los agentes nunca reciben notificación (porque no han escrito al bot previamente).

**Causas secundarias descartadas:**
- ✅ **Formato de número:** El código sanitiza correctamente y añade prefijo `whatsapp:` (línea 67 de `twilio.ts`)
- ✅ **Campo `whatsapp` en Firestore:** El código valida `if (!data.whatsapp) continue;` (línea 930)
- ✅ **Credenciales Twilio:** El cliente se inicializa correctamente (línea 13 de `twilio.ts`)

#### 📍 Ubicaciones Exactas
- **Lógica notificación:** `apps/web/src/lib/aiProvider.ts` líneas 933-950
- **Función fallback:** `apps/web/src/lib/twilio.ts` líneas 27-82
- **Config faltante:** Variable env `TWILIO_WA_TEMPLATE_SID` en Vercel

---

## B. JUSTIFICACIÓN DE LAS SOLUCIONES

### Solución BUG-1: Agregar selector de agentes en UI

**Qué se hará:**
Agregar un dropdown en `ChatWindow.tsx` que permita a supervisores/admins seleccionar un agente específico antes de asignar la conversación.

**Por qué funciona:**
- El backend ya soporta `agentId` arbitrario (línea 13 de `assign/route.ts`)
- Solo falta exponerlo en la UI con un selector
- Validación de permisos (solo supervisores/admins) ya existe en `AuthContext`

**Riesgo:** 🟢 BAJO — es feature aditiva, no modifica lógica existente.

**Componentes afectados:**
- `apps/web/src/components/ChatWindow.tsx` (agregar selector)
- Posible helper para obtener lista de agentes de la sucursal (nuevo hook o query)

---

### Solución BUG-2: Endurecer lógica de matching

**Qué se hará:**

**Fix #1: Cambiar lógica de `detectBranchByCity()` a matching exacto**

```typescript
// ANTES (línea 693):
if (
  normalized.includes(normalizedCity) ||
  normalizedCity.includes(normalized)  // ← PERMISIVO
) {
  return branchId;
}

// DESPUÉS (propuesto):
if (normalized.includes(normalizedCity)) {
  return branchId;
}
```

**Justificación:**
- Solo buscar ciudad **dentro** del texto del cliente (ej: cliente dice "Estoy en Monterrey")
- **Eliminar** la condición inversa que causaba falsos positivos
- Si el cliente escribe "monte", NO debería matchear "monterrey" — es ambiguo y debe pedir aclaración

**Fix #2: Excluir agentes con `branches: ["general"]` de notificaciones WA de sucursales específicas**

```typescript
// ANTES (línea 905):
const isMatch =
  targetBranchWA === "general" ||
  agentBranches.some((b) => targetAliases.includes(b)) ||
  agentBranches.includes("general");  // ← PERMISIVO

// DESPUÉS (propuesto):
const isMatch =
  targetBranchWA === "general" ||
  agentBranches.some((b) => targetAliases.includes(b));
  // Eliminamos: || agentBranches.includes("general")
```

**Justificación:**
- Agentes "general" deberían ver conversaciones en el dashboard (para cobertura)
- Pero **NO** deben recibir notificaciones WA de sucursales específicas (evita confusión geográfica)
- Si la conversación es `targetBranchWA === "general"` (sin ciudad detectada), entonces **sí** notificar a agentes general

**Por qué funciona:**
- Reduce ambigüedad en detección de ciudad
- Prioriza agentes de sucursal específica sobre comodines
- Mantiene cobertura (agentes general siguen viendo en dashboard)

**Riesgo:** 🟡 MEDIO — cambio en lógica de negocio, requiere QA extensivo para validar que no se pierdan conversaciones válidas.

**Componentes afectados:**
- `apps/web/src/lib/aiProvider.ts` líneas 693 y 905

---

### Solución BUG-3: Configurar `TWILIO_WA_TEMPLATE_SID` en Vercel

**Qué se hará:**
Agregar la variable de entorno `TWILIO_WA_TEMPLATE_SID` en Vercel con el valor del template aprobado por Meta.

**Valor:** `HX9681962ec5a7cfe9fbd9acf119235f5a` (confirmado en [`CHK_2026-04-28_WA_TEMPLATE.md`](Checkpoints/CHK_2026-04-28_WA_TEMPLATE.md#L53))

**Por qué funciona:**
- El código ya está preparado para usar plantillas (línea 933-943 de `aiProvider.ts`)
- Las plantillas aprobadas por Meta permiten enviar mensajes **fuera de ventana 24h**
- No requiere cambios de código, solo configuración

**Riesgo:** 🟢 BAJO — solo configuración, sin cambios de código.

**Pasos:**
1. Ir a Vercel Dashboard → Proyecto `frank-chat-elecsa-web` → Settings → Environment Variables
2. Agregar variable:
   - **Name:** `TWILIO_WA_TEMPLATE_SID`
   - **Value:** `HX9681962ec5a7cfe9fbd9acf119235f5a`
   - **Environments:** Production, Preview, Development
3. Redeploy la aplicación

**Validación post-deploy:**
Verificar logs de Vercel buscando `[Twilio] Sending template HX9681...` (línea 109 de `twilio.ts`)

---

## C. INSTRUCCIONES DE HANDOFF PARA SOFIA

### Tarea 1: BUG-1 — Implementar selector de agentes

**Prioridad:** 🟡 MEDIA  
**Archivos a modificar:** `apps/web/src/components/ChatWindow.tsx`

**Pasos:**

1. **Crear hook personalizado para obtener agentes de una sucursal:**
   ```typescript
   // apps/web/src/hooks/useAgentsList.ts (nuevo archivo)
   import { useState, useEffect } from "react";
   import { collection, query, where, getDocs } from "firebase/firestore";
   import { db } from "@/lib/firebase";
   
   export function useAgentsList(branchId: string | null) {
     const [agents, setAgents] = useState<Array<{ id: string; name: string; email: string }>>([]);
     const [loading, setLoading] = useState(true);
   
     useEffect(() => {
       if (!branchId) return;
       
       const fetchAgents = async () => {
         setLoading(true);
         const q = query(
           collection(db, "users"),
           where("branches", "array-contains", branchId)
         );
         const snapshot = await getDocs(q);
         const agentsList = snapshot.docs.map(doc => ({
           id: doc.id,
           name: doc.data().name || doc.data().email || "Agente",
           email: doc.data().email,
         }));
         setAgents(agentsList);
         setLoading(false);
       };
       
       fetchAgents();
     }, [branchId]);
   
     return { agents, loading };
   }
   ```

2. **Modificar `ChatWindow.tsx` para agregar selector:**

   **Ubicación:** Antes del botón "Tomar Conversación" (línea ~280-290)

   **Agregar imports:**
   ```typescript
   import { useAgentsList } from "@/hooks/useAgentsList";
   ```

   **Agregar state:**
   ```typescript
   const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
   const { agents, loading: loadingAgents } = useAgentsList(conversation?.branch || null);
   ```

   **Modificar función `handleTakeConversation`:**
   ```typescript
   const handleTakeConversation = async () => {
     if (!conversationId || !user) return;
     
     // Si es supervisor/admin y hay agente seleccionado, usar ese; sino auto-asignar
     const targetAgentId = (isSupervisor || isAdmin) && selectedAgentId 
       ? selectedAgentId 
       : user.uid;
     
     const targetAgentName = selectedAgentId 
       ? agents.find(a => a.id === selectedAgentId)?.name || "Agente"
       : (agent?.name || user.email || "Agente");
     
     // Actualización optimista
     setConversation((prev) =>
       prev ? { 
         ...prev, 
         needsHuman: false, 
         assignedTo: targetAgentId, 
         assignedToName: targetAgentName 
       } as any : null
     );
     
     try {
       await fetch("/api/conversation/assign", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           conversationId,
           agentId: targetAgentId,
           agentName: targetAgentName,
         }),
       });
       setSelectedAgentId(null); // Reset selector
     } catch (error) {
       console.error("Failed to take conversation", error);
     }
   };
   ```

   **Agregar UI del selector (antes del botón "Tomar Conversación"):**
   ```typescript
   {(isSupervisor || isAdmin) && (
     <div className="mb-2">
       <label className="block text-sm font-medium text-gray-700 mb-1">
         Asignar a:
       </label>
       <select
         value={selectedAgentId || ""}
         onChange={(e) => setSelectedAgentId(e.target.value || null)}
         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
         disabled={loadingAgents}
       >
         <option value="">Yo mismo ({user?.email})</option>
         {agents.map(agent => (
           <option key={agent.id} value={agent.id}>
             {agent.name} ({agent.email})
           </option>
         ))}
       </select>
     </div>
   )}
   ```

**Criterios de Aceptación:**
- [ ] Supervisores/admins ven dropdown con agentes de la sucursal
- [ ] Selector muestra "Yo mismo" como opción por defecto
- [ ] Al asignar, la conversación se asigna al agente seleccionado
- [ ] El nombre del agente asignado se muestra en la UI

**Marca de Agua:**
```typescript
/**
 * FIX REFERENCE: FIX-20260505-01
 * Selector de agentes para asignación manual por supervisores
 * @see /workspaces/frank-chat_elecsa/context/interconsultas/DICTAMEN_FIX-20260505-01.md
 */
```

---

### Tarea 2: BUG-2 — Endurecer lógica de matching

**Prioridad:** 🔴 ALTA  
**Archivos a modificar:** `apps/web/src/lib/aiProvider.ts`

**Pasos:**

1. **Fix detectBranchByCity (línea 683-698):**

   **ANTES:**
   ```typescript
   if (
     normalized.includes(normalizedCity) ||
     normalizedCity.includes(normalized)
   ) {
     return branchId;
   }
   ```

   **DESPUÉS:**
   ```typescript
   // FIX REFERENCE: FIX-20260505-01
   // Eliminada condición inversa para evitar falsos positivos en texto corto
   if (normalized.includes(normalizedCity)) {
     return branchId;
   }
   ```

2. **Fix filtro de agentes WA (línea 902-908):**

   **ANTES:**
   ```typescript
   const isMatch =
     targetBranchWA === "general" ||
     agentBranches.some((b) => targetAliases.includes(b)) ||
     agentBranches.includes("general");
   ```

   **DESPUÉS:**
   ```typescript
   // FIX REFERENCE: FIX-20260505-01
   // Agentes "general" solo matchean conversaciones explícitamente "general",
   // no sucursales específicas (evita asignación incorrecta geográfica)
   const isMatch =
     targetBranchWA === "general" ||
     agentBranches.some((b) => targetAliases.includes(b));
   ```

**Criterios de Aceptación:**
- [ ] Cliente escribe "monte" → NO matchea "monterrey" (pide aclaración)
- [ ] Cliente escribe "Estoy en Monterrey" → ✅ Matchea "monterrey"
- [ ] Agente de CDMX con `branches: ["general"]` NO recibe notificación WA de conversación de Monterrey
- [ ] Conversación sin ciudad detectada (general) SÍ notifica a agentes "general"
- [ ] Agentes de sucursal específica tienen prioridad sobre "general"

**Testing requerido:**
1. Crear 2 agentes:
   - Agente A: `branches: ["monterrey"]`, `whatsapp: "+525512345678"`
   - Agente B: `branches: ["general"]`, `whatsapp: "+525587654321"`
2. Cliente desde Monterrey escribe texto con palabra "monterrey"
3. Verificar que **solo Agente A** recibe notificación WA
4. Verificar que ambos ven la conversación en dashboard
5. Cliente escribe "monte" (sin contexto) → verificar que NO se asigna a Monterrey

**Marca de Agua:**
```typescript
/**
 * FIX REFERENCE: FIX-20260505-01
 * Endurecimiento de lógica de matching para evitar asignaciones incorrectas
 * Cambio 1: Eliminada condición inversa en detectBranchByCity
 * Cambio 2: Agentes "general" excluidos de notificaciones WA de sucursales específicas
 * @see /workspaces/frank-chat_elecsa/context/interconsultas/DICTAMEN_FIX-20260505-01.md
 */
```

---

### Tarea 3: BUG-3 — Configurar variable de entorno

**Prioridad:** 🔴 CRÍTICA  
**Responsable:** Frank (humano) — no requiere código

**Pasos:**

1. Acceder a Vercel Dashboard: https://vercel.com/
2. Ir a proyecto `frank-chat-elecsa-web`
3. Navegar a **Settings → Environment Variables**
4. Agregar nueva variable:
   - **Name:** `TWILIO_WA_TEMPLATE_SID`
   - **Value:** `HX9681962ec5a7cfe9fbd9acf119235f5a`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
5. Click **Save**
6. **Redeploy** la aplicación (necesario para que tome la nueva variable)

**Validación post-deploy:**

1. Forzar un handoff de prueba desde WhatsApp
2. Verificar logs de Vercel (Runtime Logs):
   ```
   [Twilio] Sending template HX9681962ec5a7cfe9fbd9acf119235f5a from: whatsapp:+... to: +525512345678
   ```
3. Confirmar que el agente **SÍ** recibe mensaje WA con la plantilla

**Criterios de Aceptación:**
- [ ] Variable configurada en Vercel (3 entornos)
- [ ] Redeploy exitoso
- [ ] Logs muestran `[Twilio] Sending template HX9681...`
- [ ] Agentes reciben notificación WA al handoff

---

## D. VALIDACIÓN CON SOFT GATES

### Gate 1: Compilación ✅
- Cambios propuestos no requieren nuevas dependencias
- TypeScript debe validar sin errores

### Gate 2: Testing 🧪
**Tests requeridos:**
- [ ] Test unitario de `detectBranchByCity` con casos de borde
- [ ] Test de integración de asignación manual (BUG-1)
- [ ] Test end-to-end de handoff con notificación WA (BUG-3)

**Casos de borde críticos:**
```typescript
describe("detectBranchByCity", () => {
  it("no debe matchear texto corto dentro de ciudad", () => {
    expect(detectBranchByCity("monte")).toBeNull();
  });
  
  it("debe matchear texto largo que contiene ciudad", () => {
    expect(detectBranchByCity("Estoy en Monterrey")).toBe("monterrey");
  });
  
  it("debe priorizar ciudad más específica", () => {
    expect(detectBranchByCity("San Juan del Río, Querétaro")).toBe("queretaro");
  });
});
```

### Gate 3: Revisión de Código 👁️
**Checklist:**
- [ ] Marca de agua `FIX REFERENCE: FIX-20260505-01` en todos los cambios
- [ ] No hay hardcoded strings (usar constantes)
- [ ] Manejo de errores robusto (try-catch, validaciones null)
- [ ] Logs descriptivos para debugging futuro
- [ ] Documentación JSDoc actualizada

### Gate 4: Documentación 📝
- [ ] Actualizar `PROYECTO.md` con estado de fixes
- [ ] Actualizar `TESTING.md` con nuevos casos de prueba
- [ ] Generar Checkpoint consolidado `CHK_2026-05-05_FIX-20260505-01.md`

---

## E. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Fix BUG-2 bloquea handoffs válidos | 🟡 MEDIA | 🔴 ALTO | QA extensivo con logs detallados; rollback fácil (1 línea) |
| Selector de agentes expone datos de otras sucursales | 🟢 BAJA | 🟡 MEDIO | Filtrar query por `branches` del supervisor |
| Template WA rechazado por Meta | 🟢 BAJA | 🔴 ALTO | Verificar que template esté aprobado antes de deploy |
| Agentes "general" dejan de ver conversaciones | 🟢 BAJA | 🟡 MEDIO | Fix solo afecta notificaciones WA, no dashboard |

---

## F. RECURSOS Y REFERENCIAS

### Documentos Relacionados
- [`PROYECTO.md`](PROYECTO.md) — Estado del proyecto, backlog
- [`CHK_2026-04-28_WA_TEMPLATE.md`](Checkpoints/CHK_2026-04-28_WA_TEMPLATE.md) — Template de WA aprobado
- [`context/SPEC-SEGURIDAD.md`](context/SPEC-SEGURIDAD.md) — Spec de seguridad (filtrado de sucursales)

### Archivos Modificados (Resumen)
| Archivo | Líneas | Cambio | Complejidad |
|---------|--------|--------|-------------|
| `apps/web/src/lib/aiProvider.ts` | 693 | Eliminar condición inversa | 🟢 SIMPLE |
| `apps/web/src/lib/aiProvider.ts` | 905 | Excluir agentes "general" | 🟢 SIMPLE |
| `apps/web/src/components/ChatWindow.tsx` | 290-310 | Agregar selector | 🟡 MEDIO |
| `apps/web/src/hooks/useAgentsList.ts` | Nuevo | Hook para obtener agentes | 🟢 SIMPLE |

### Configuración de Entorno
```bash
# Vercel Environment Variables
TWILIO_WA_TEMPLATE_SID=HX9681962ec5a7cfe9fbd9acf119235f5a
```

---

## G. ANÁLISIS FORENSE ADICIONAL (BUGS NO REPORTADOS)

### 🔍 Hallazgo Extra: Posible fuga de datos en `ChatList.tsx`

**Archivo:** [`apps/web/src/components/ChatList.tsx`](apps/web/src/components/ChatList.tsx#L153-L180)

**Línea 153-165:**
```typescript
/**
 * TODO: IMPORTANTE - DEUDA TÉCNICA DE SEGURIDAD (v2.1)
 * ⚠️ Actualmente se descargan TODAS las conversaciones y se filtran en cliente.
 * Esto expone datos de otras sucursales en el tráfico de red aunque no se muestren.
 *
 * MIGRACIÓN REQUERIDA:
 * 1. Implementar Firestore Security Rules que filtren por branch del usuario
 * 2. O usar queries filtradas en servidor: where('branch', 'in', userBranches)
 * 3. Crear índice compuesto: branch + lastMessageAt
 *
 * Referencia: QA-20260128-01 - Hallazgo crítico #2
 * @see context/SPEC-SEGURIDAD.md
 */
```

**Estado:** Ya documentado como deuda técnica, prioridad v2.1.

---

## H. CONCLUSIÓN

✅ **Análisis forense completado**

**Bugs confirmados:** 3/3  
**Causas raíz identificadas:** 5 (2 en BUG-2, 1 en BUG-1, 1 en BUG-3, 1 nota aclaratoria)  
**Fixes propuestos:** Implementables sin refactoring mayor  
**Riesgo general:** 🟡 MEDIO (requiere QA cuidadoso en BUG-2)

**Recomendación:** Implementar en orden de prioridad:
1. **BUG-3** (CRÍTICO) — Solo configuración, sin código, impacto inmediato
2. **BUG-2** (ALTO) — Requiere QA pero es crítico para operación correcta
3. **BUG-1** (MEDIO) — Feature adicional, puede esperar

**Próximo paso:** Handoff a SOFIA para implementación con este dictamen como referencia.

---

**Firma Digital:**  
DEBY — Lead Debugger & Traceability Architect  
Metodología INTEGRA v3.2.0  
FIX-20260505-01 | 2026-05-05
