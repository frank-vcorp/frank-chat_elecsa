# Guía de Pruebas (Testing)

Este documento describe cómo validar las funcionalidades del sistema Frank Chat.

## 1. Pruebas Manuales (E2E)

### Flujo de Chat
1.  **Iniciar Servidor**: Ejecuta `npm run dev` en `apps/web`.
2.  **Simular Webhook**: Usa Postman o curl para enviar un mensaje a `http://localhost:3000/api/twilio/webhook`.
    ```bash
    curl -X POST http://localhost:3000/api/twilio/webhook \
      -d "From=whatsapp:+1234567890" \
      -d "Body=Hola, prueba de sistema" \
      -d "ProfileName=Tester"
    ```
3.  **Verificar Dashboard**:
    *   Abre `http://localhost:3000/dashboard`.
    *   Deberías ver la nueva conversación.
    *   Verifica que la IA responda (si está configurada).

### Funcionalidades Nuevas (SOFIA)
1.  **Resumen Automático**:
    *   En el Dashboard, selecciona una conversación.
    *   Haz clic en "Cerrar Conversación" (o icono de check).
    *   Ve a `/admin/reports` y verifica que aparezca la conversación con un resumen generado.
2.  **Cierre Automático**:
    *   Para probar localmente, puedes llamar manualmente al cron job:
        `GET http://localhost:3000/api/cron/close-inactive`
    *   Esto cerrará conversaciones abiertas asignadas a humanos con >30 min de inactividad.

## 2. Pruebas Automatizadas

Actualmente no hay un suite de tests unitarios configurado (Jest/Vitest).
Se recomienda instalar Jest para pruebas futuras.

### Script de Simulación
Puedes crear un script simple para inyectar mensajes masivos si es necesario.
