# CHK_2025-01-15_BRANCH_ROUTING - Sistema de Routing por Sucursales

## Información del Checkpoint
- **ID**: CHK_2025-01-15_BRANCH_ROUTING
- **Agente**: SOFIA
- **Fecha**: 2025-01-15
- **Estado**: ✅ Implementado

## Resumen Ejecutivo
Implementación completa del sistema de routing de conversaciones por sucursal para ELECSA. Cuando Sofia detecta que necesita escalar a un humano (semáforo rojo), ahora detecta automáticamente la ciudad del cliente y asigna la conversación a la sucursal correspondiente.

## Cambios Implementados

### 1. Tipos y Modelos (`src/lib/types.ts`)
- Agregado tipo `BranchId` con las 11 sucursales de ELECSA + 'general'
- Agregado campo `branch?: BranchId` a interfaces `Agent` y `Conversation`
- Agregado rol `supervisor` para usuarios que pueden ver todas las sucursales

### 2. Detección de Sucursal (`src/lib/aiProvider.ts`)
- `BRANCHES_CONFIG`: Mapeo de ciudades a sucursales con variantes de nombres
- `detectBranchByCity(cityText)`: Detecta sucursal desde texto con nombre de ciudad
- `handOffToHuman(conversationId, reason, detectedCity?)`: Mejorado para asignar sucursal

### 3. Webhook de Twilio (`src/app/api/twilio/webhook/route.ts`)
- `detectEscalation(response)`: Detecta si Sofia indica semáforo rojo
- `extractCityMention(text)`: Extrae menciones de ciudades en el mensaje
- Integración: Cuando Sofia escala, se detecta ciudad y se asigna a sucursal

### 4. Contexto de Autenticación (`src/lib/AuthContext.tsx`)
- Nuevo contexto React para datos del agente logueado
- Expone: `user`, `agent`, `loading`, `isAdmin`, `isSupervisor`, `branch`
- Se carga automáticamente el perfil del agente desde Firestore

### 5. Lista de Conversaciones (`src/components/ChatList.tsx`)
- Filtro automático por sucursal según rol del agente:
  - **Admin/Supervisor**: Ve todas, puede filtrar por sucursal
  - **Agente**: Solo ve su sucursal + conversaciones sin asignar
- Badge visual con nombre de sucursal en cada conversación
- Selector de sucursal en panel de filtros (solo supervisores)

### 6. Layout Principal (`src/app/layout.tsx`)
- Envuelve la app con `AuthProvider` para acceso global al contexto

### 7. API de Agentes (`src/app/api/agents/route.ts`)
- Soporta campo `branch` al crear/actualizar agentes humanos

## Sucursales Configuradas

| ID | Nombre | Ciudades Cubiertas |
|----|--------|-------------------|
| guadalajara | Guadalajara | guadalajara, gdl, zapopan, tlaquepaque, jalisco |
| coahuila | Coahuila | saltillo, torreon, monclova, piedras negras |
| leon | León | leon, guanajuato, irapuato, celaya |
| queretaro | Querétaro | queretaro, qro, san juan del rio |
| toluca | Toluca | toluca, metepec, estado de mexico |
| monterrey | Monterrey | monterrey, mty, san pedro, nuevo leon |
| centro | CDMX Centro | cdmx centro, cuauhtemoc, benito juarez |
| armas | CDMX Armas | cdmx, ciudad de mexico, azcapotzalco |
| veracruz | Veracruz | veracruz, xalapa, boca del rio |
| slp | San Luis Potosí | san luis potosi, slp, ciudad valles |
| puebla | Puebla | puebla, cholula, atlixco |

## Flujo de Escalación

```
Cliente menciona ciudad → Sofia responde con [SEMÁFORO: ROJO]
                            ↓
            webhook detecta escalación
                            ↓
        extractCityMention() busca ciudad en mensaje
                            ↓
        detectBranchByCity() mapea ciudad → sucursal
                            ↓
    handOffToHuman() actualiza conversation.branch
                            ↓
    Dashboard filtra por branch del agente logueado
```

## Próximos Pasos
1. ⏳ Crear agente de prueba: Ana Díaz → Querétaro → ana_diaz@elecsa.com.mx
2. ⏳ Probar flujo completo de escalación
3. ⏳ Agregar notificaciones push por sucursal (opcional)

## Archivos Modificados
- `apps/web/src/lib/types.ts`
- `apps/web/src/lib/aiProvider.ts`
- `apps/web/src/lib/AuthContext.tsx` (nuevo)
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/api/twilio/webhook/route.ts`
- `apps/web/src/app/api/agents/route.ts`
- `apps/web/src/components/ChatList.tsx`

## Verificación Local
- ✅ TypeScript compila sin errores
- ✅ Build de Next.js pasa compilación (falla en runtime por falta de Firebase local)
- ⏳ Pendiente: Probar en producción con agente de prueba
