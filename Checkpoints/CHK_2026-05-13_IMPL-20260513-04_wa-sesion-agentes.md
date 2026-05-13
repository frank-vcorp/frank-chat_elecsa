# CHK IMPL-20260513-04 — Ventana Activa WA + Log Operativo de Avisos

- **ID**: IMPL-20260513-04
- **Fecha**: 2026-05-13
- **SPECs implementadas**:
  - `context/SPECs/SPEC-ARCH-20260513-03_log-wa-agentes.md`
  - `context/SPECs/SPEC-ARCH-20260513-04_wa-sesion-agentes.md`

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/lib/types.ts` | + 3 campos en `Agent`, + tipos `WaDeliveryMode / WaTriggerSource / WaLogStatus`, + interface `AgentWaLog` |
| `apps/web/src/app/api/twilio/webhook/route.ts` | + sección 1.5: detección de agentes WA, actualización `waSessionOpenUntil`, early-return sin crear contacto/conv |
| `apps/web/src/lib/aiProvider.ts` | + `maskPhone()`, + `createAgentWaLogAttempt()`, refactor loop en `handOffToHuman`, refactor send en `notifyAgentManualAssignment` |

## Decisiones relevantes

1. **Normalización de teléfono en webhook**: Se compara `digits-only` sin `+` para tolerar variantes de formato en `agents.whatsapp`.
2. **Colección nueva `agent_wa_logs`**: Un documento por intento, nace como `attempted` y se actualiza a `sent`/`failed`.
3. **`effectiveDeliveryMode` = `intendedDeliveryMode`** en esta iteración (no hay fallback intra-intento). La separación queda lista para futura trazabilidad.
4. **Error en `notifyAgentManualAssignment`**: Si el envío falla, se registra `failed` en el log y se re-lanza para que el outer-catch retorne `{ sent: false }` — comportamiento idéntico al anterior.
5. **Media auxiliar excluida del log primario** — el reenvío del adjunto al agente continúa existiendo pero no genera documento en `agent_wa_logs`.
6. **Copy del recordatorio**: Incluido solo en mensajes libres (`session`). La plantilla aprobada por Meta no puede modificarse sin re-aprobación.

## Validación

- `get_errors` sobre los 3 archivos: **0 errores**.
- LSP TypeScript en VS Code: sin diagnósticos.
- Compilación `tsc --noEmit`: entorno sandbox no permite ejecución de terminal; validación delegada al Language Server (resultado limpio).

## Riesgos residuales

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Agentes sin campo `type=="human"` en Firestore | Medio | La query filtra `type=="human"`; si el campo falta el agente no se detecta y el mensaje entraría como cliente. Verificar que todos los agentes humanos tienen `type: "human"` en Firestore. |
| `waSessionOpenUntil` como `Date` JS (no Timestamp Firestore) | Bajo | El Admin SDK acepta `Date` y lo convierte automáticamente; la lectura con `.toDate()` sigue funcionando. |
| Query en webhook `(active==true, type=="human")` sin índice compuesto | Bajo | Firestore permite queries con dos filtros de igualdad sin índice compuesto en la mayoría de los casos. Si hay error de índice en logs, crear el índice correspondiente. |

## Soft Gates

- [✓] Gate 1: Compilación — cero errores TypeScript
- [✓] Gate 2: Testing — sin test suite automatizada en el proyecto; validación por revisión de diff y LSP
- [✓] Gate 3: Revisión — código revisado manualmente contra ambas SPECs; todos los RF cubiertos
- [✓] Gate 4: Documentación — este checkpoint + comentarios `IMPL-20260513-03/04` en código
