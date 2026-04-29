# CHK_2026-04-28 — Sesión WhatsApp Template + Badges

**ID de Intervención:** ARCH-20260428-01  
**Fecha:** 2026-04-28  
**Agente:** INTEGRA + SOFIA (delegación directa por scope mínimo)  
**Duración estimada:** ~2 horas  

---

## 🎯 Entregable de la Sesión

Sistema de notificación WhatsApp a agentes usando plantilla aprobada por Meta, eliminando el error 63016 que impedía notificar a agentes que no habían iniciado conversación en las últimas 24h.

---

## ✅ Tareas Completadas

| # | Tarea | Commit | Estado |
|---|-------|--------|--------|
| 1 | Badge "WhatsApp" verde en ChatList | `11b23bf` | ✓ |
| 2 | Badge nombre del agente asignado en ChatList | `11b23bf` | ✓ |
| 3 | Sanitizar espacios en número de WhatsApp | `1bc4eb3` | ✓ |
| 4 | Logs detallados en handOffToHuman | `a7a2ec6` | ✓ |
| 5 | Patrones propuesta/cotización en detectEscalation | `3e76a67` | ✓ |
| 6 | Branch alias matching (id + displayName) | `76c7f83` | ✓ |
| 7 | Token refresh cada 50 min en ChatWindow | `fd846e8` | ✓ |
| 8 | Fix FCM return prematuro bloqueando WA | `c7c01ae` | ✓ |
| 9 | assignedToName visible sin "Tomar conversación" | `87a6bed` | ✓ |
| 10 | isMediaEscalation — imágenes siempre escalan | `3f019f3` | ✓ |
| 11 | Proxy Firebase Storage + evitar login redirect | `48ef2c6` | ✓ |
| 12 | Branch fallback de conversación existente en Firestore | `23a4443` | ✓ |
| 13 | Supervisores excluidos del filtro WA (solo role=agent) | `6970544` | ✓ |
| 14 | `sendWhatsAppTemplate()` en twilio.ts + integración en aiProvider.ts | `1ff28aa` | ✓ |

---

## 📦 Archivos Modificados (sesión completa)

- `apps/web/src/lib/twilio.ts` — Nueva función `sendWhatsAppTemplate` con `contentSid` + `contentVariables`
- `apps/web/src/lib/aiProvider.ts` — Usa plantilla si `TWILIO_WA_TEMPLATE_SID` está definido, fallback a texto libre
- `apps/web/src/lib/types.ts` — `assignedToName?: string`, `waCanalizado?: boolean`
- `apps/web/src/components/ChatList.tsx` — Badges WA + nombre agente
- `apps/web/src/components/ChatWindow.tsx` — Token refresh + proxy Firebase Storage
- `apps/web/src/app/api/media/proxy/route.ts` — Manejo dual Twilio + Firebase Storage
- `apps/web/src/app/api/twilio/webhook/route.ts` — Branch fallback, isMediaEscalation, nuevos patrones

---

## 🔧 Configuración Pendiente (Manual)

| Variable | Valor | Plataforma |
|----------|-------|------------|
| `TWILIO_WA_TEMPLATE_SID` | `HX9681962ec5a7cfe9fbd9acf119235f5a` | Vercel → Settings → Env Vars |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | (ver Firebase Console) | Vercel → Settings → Env Vars |

> ⚠️ Después de agregar variables → hacer Redeploy manual en Vercel

---

## 📋 Plantilla Twilio

- **Nombre:** `elecsa_notificacion_agente`
- **Content SID:** `HX9681962ec5a7cfe9fbd9acf119235f5a`
- **Estado:** ✅ Approved por Meta (28 abril 2026)
- **Idioma:** Español
- **Categoría:** Marketing
- **Variables:** `{{1}}`=sucursal, `{{2}}`=cliente, `{{3}}`=teléfono display, `{{4}}`=dígitos wa.me, `{{5}}`=resumen

---

## 🧪 Cómo Validar Mañana

1. Un usuario externo envía mensaje a `+15558878863` en WhatsApp
2. Sofía atiende; el usuario solicita cotización o envía imagen
3. Sofía detecta escalación → `handOffToHuman()` se ejecuta
4. El agente de la sucursal correspondiente recibe mensaje WhatsApp con la plantilla aprobada
5. Verificar en ChatList: badge "WhatsApp" verde + nombre del agente asignado

---

## ⏭️ Próximo Micro-Sprint (sugerido)

- Crear índice Firestore para `context_docs` (link pendiente en logs)
- Validar reportes dashboard analítico en producción
- Confirmar `NEXT_PUBLIC_FIREBASE_VAPID_KEY` en Vercel para notificaciones push FCM
