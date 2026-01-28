# DICTAMEN DE AUDITORÍA DE CALIDAD (QA)

**ID de referencia:** QA-20260128-01
**ID de origen:** IMPL-20250128-01
**Auditor:** GEMINI-CLOUD-QA
**Fecha:** 28 Enero 2026

## 1. Veredicto General
🔴 **NO APROBADO - REQUIERE CORRECCIONES** (Soft Fail)

Se han detectado fallos de seguridad críticos y observaciones de arquitectura que deben resolverse antes de considerar la implementación como "Completada".

## 2. Evaluación de Soft Gates

| Gate | Estado | Observaciones |
|------|--------|---------------|
| **Compilación** | ✅ Pasa | No se detectaron errores de build. |
| **TypeScript** | ✅ Pasa | Sin errores de tipos. |
| **Convenciones** | ⚠️ Alerta | Lógica duplicada de notificaciones entre componentes. |
| **Seguridad** | 🔴 Falla | Endpoint administrativo expuesto públicamente. |

## 3. Hallazgos Detallados

### 🚨 Críticos (Bloqueantes)
**1. Endpoint `/api/agents/fix` expuesto sin autenticación**
- **Archivo:** `apps/web/src/app/api/agents/fix/route.ts`
- **Problema:** El endpoint `POST` no verifica sesión ni rol de administrador. Cualquier usuario (o bot) externo puede invocarlo.
- **Riesgo:** Consumo de cuota Firestore (DoS) y potenciales escrituras no autorizadas si se modifica la lógica futura.
- **Acción:** Implementar verificación de sesión y rol admin antes de procesar la solicitud.

### ⚠️ Importantes (Deuda Técnica / Seguridad)
**2. Data Leakage por Filtrado en Cliente**
- **Archivo:** `apps/web/src/components/ChatList.tsx` y `StatusBar.tsx`
- **Problema:** Se descargan **todas** las conversaciones (`collection(db, 'conversations')`) y se filtran en el navegador (`filteredConversations`).
- **riesgo:** Un agente asignado a "Guadalajara" recibe técnicamente los datos de "Monterrey" en su navegador. Un usuario avanzado puede inspeccionar la red y ver datos que no debería.
- **Acción:** Implementar Query de Firestore con `where` dinámico según el rol/sucursal del usuario, o Security Rules más estrictas si se usa client SDK.

**3. Duplicidad de Lógica de Notificaciones**
- **Archivos:** `StatusBar.tsx` vs `ChatList.tsx`
- **Problema:**
    - `StatusBar`: Usa Web Audio API (Oscillator) cuando `needsHuman` incrementa.
    - `ChatList`: Usa `new Audio('/sounds/notification.mp3')` y `Notification` API cuando `needsHuman` incrementa.
- **Impacto:** Doble sonido y posible conflicto de recursos. Experiencia de usuario inconsistente.
- **Acción:** Centralizar la lógica de notificaciones en un Context (`NotificationContext`) o dejarla en un solo componente (preferiblemente `StatusBar` si es global, o `ChatList` si es contextual).

### ℹ️ Menores (Calidad de Código/Performance)
**4. Rendimiento de Suscripciones Firestore**
- **Archivo:** `StatusBar.tsx`
- **Problema:** `onSnapshot` sin límite de documentos. En producción con miles de chats, esto será lento y costoso.
- **Acción:** Agregar `.limit(100)` o filtrar solo los necesarios para las métricas si es posible (aunque para métricas totales se requiere agregación server-side a futuro).

## 4. Recomendaciones de Corrección

### A. Asegurar Endpoint de Fix
```typescript
// apps/web/src/app/api/agents/fix/route.ts
import { getServerSession } from "next-auth"; // O tu método de auth server-side
// ...
export async function POST(req: NextRequest) {
    // Validar autenticación aquí
    // Si no hay middleware, verificar token manual o header secreto
    // Ejemplo simple si usas custom auth header o session:
    const authHeader = req.headers.get('authorization');
    if (authHeader !== process.env.CRON_SECRET) { // O lógica de admin real
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // ...
}
```
*Nota: Si es herramienta manual, requerir que el usuario sea Admin en la DB.*

### B. Unificar Notificaciones
Decidir un "dueño" de las notificaciones. Si `StatusBar` está siempre presente, mover la lógica allí y eliminarla de `ChatList`, o viceversa. Recomiendo usar `StatusBar` para las métricas globales y alertas.

### C. Reforzar Consultas (Query Security)
Modificar `ChatList` para que pida solo lo necesario:
```typescript
// Si soy agente de GDL:
const q = query(
  collection(db, 'conversations'), 
  where('branch', 'in', ['guadalajara', 'general']), 
  orderBy('lastMessageAt', 'desc')
);
```

## 5. Siguientes Pasos
1. SOFIA debe aplicar el fix de seguridad en `api/agents/fix` inmediatamente.
2. Decidir estrategia de unificación de audio.
3. Solicitar re-evaluación (QA) una vez aplicados los parches.
