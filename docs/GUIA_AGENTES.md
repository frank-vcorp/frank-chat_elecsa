# 📱 Guía del Agente - Dashboard de Chat ELECSA

## 📋 Índice
1. [Acceso al Sistema](#acceso-al-sistema)
2. [Panel Principal](#panel-principal)
3. [Lista de Conversaciones](#lista-de-conversaciones)
4. [Atender una Conversación](#atender-una-conversación)
5. [Sistema de Etiquetas](#sistema-de-etiquetas)
6. [Notas Internas](#notas-internas)
7. [Plantillas de Respuesta](#plantillas-de-respuesta)
8. [Cerrar Conversaciones](#cerrar-conversaciones)
9. [Mejores Prácticas](#mejores-prácticas)

---

## Acceso al Sistema

### Primer Ingreso
1. Accede a la URL del dashboard proporcionada por tu supervisor
2. Ingresa con tu **email** y **contraseña temporal**
3. El sistema te pedirá **cambiar tu contraseña** obligatoriamente
4. Usa una contraseña segura de al menos 6 caracteres

### Inicio de Sesión Normal
1. Ve a `/login`
2. Ingresa tus credenciales
3. Serás redirigido al dashboard de chat

> ⚠️ **Importante**: Si olvidaste tu contraseña, contacta a tu supervisor o administrador.

---

## Panel Principal

Al ingresar verás dos áreas principales:

```
┌─────────────────────────────────────────────────────────┐
│  Lista de          │                                    │
│  Conversaciones    │     Ventana de Chat                │
│                    │                                    │
│  • Cliente A 🔴    │     (Selecciona una conversación)  │
│  • Cliente B       │                                    │
│  • Cliente C       │                                    │
│                    │                                    │
└─────────────────────────────────────────────────────────┘
```

### Indicadores Visuales

| Indicador | Significado |
|-----------|-------------|
| 🔴 Punto rojo parpadeante | Necesita atención urgente |
| Badge numérico azul | Mensajes sin leer |
| Badge verde con nombre | Agente asignado |
| Badge teal con sucursal | Sucursal del cliente |

---

## Lista de Conversaciones

### Filtros Disponibles

#### Por Estado
- **Todos**: Muestra todas las conversaciones
- **Humanos**: Solo las atendidas por agentes
- **IA**: Solo las que atiende Sofía

#### Por Etiqueta
Haz clic en las etiquetas para filtrar:
- Nuevo, Interesado, Cotización, Seguimiento, Ganado, Perdido, Recurrente

#### Por Búsqueda
Usa la barra de búsqueda para encontrar por número de teléfono.

### Tu Sucursal
- Solo verás conversaciones de **tu(s) sucursal(es) asignada(s)**
- Las conversaciones "General" son visibles para todos
- Los supervisores pueden ver todas las sucursales

---

## Atender una Conversación

### Tomar una Conversación

1. **Identifica** conversaciones con el indicador rojo (necesitan humano)
2. **Haz clic** en la conversación para abrirla
3. **Presiona** el botón "Tomar Conversación" en la parte inferior
4. Tu nombre aparecerá como agente asignado

> 💡 Una vez que tomas una conversación, otros agentes verán que **tú** la estás atendiendo.

### Enviar Mensajes

1. Escribe en el campo de texto inferior
2. Presiona **Enter** o el botón de enviar
3. Puedes adjuntar archivos con el ícono 📎

### Respuestas Rápidas

Haz clic en el ícono ⚡ para ver respuestas predefinidas:
- 👋 Saludo inicial
- ⏰ Pedir tiempo
- ✅ Confirmar acción
- Y más...

---

## Sistema de Etiquetas

### ¿Para Qué Sirven?
Las etiquetas ayudan a:
- Clasificar el estado de cada cliente
- Generar reportes de ventas
- Dar seguimiento a oportunidades

### Etiquetas Disponibles

| Etiqueta | Cuándo Usar | Color |
|----------|-------------|-------|
| **Nuevo** | Cliente que contacta por primera vez | 🔵 Azul |
| **Interesado** | Mostró interés en productos | 🟠 Naranja |
| **Cotización** | Solicitó precios o cotización formal | 🟣 Morado |
| **Seguimiento** | Requiere llamada o contacto posterior | 🟡 Amarillo |
| **Ganado** | Realizó compra o confirmó pedido | 🟢 Verde |
| **Perdido** | No concretó la venta | 🔴 Rojo |
| **Recurrente** | Cliente frecuente | 🔵 Cian |

### Cómo Etiquetar

1. Abre la conversación
2. Haz clic en el ícono de **etiqueta** (🏷️) en la barra superior
3. Selecciona una o más etiquetas
4. Las etiquetas se guardan automáticamente

### Mejores Prácticas de Etiquetado

- ✅ **Etiqueta al cerrar**: Siempre etiqueta antes de cerrar una conversación
- ✅ **Actualiza el estado**: Si un "Interesado" compra, cámbialo a "Ganado"
- ✅ **Usa múltiples**: Puedes combinar (ej: "Cotización" + "Seguimiento")
- ❌ **Evita**: Dejar conversaciones sin etiquetar

---

## Notas Internas

### ¿Qué Son?
Las notas son **comentarios privados** entre agentes. El cliente **nunca las ve**.

### Usos Comunes
- Anotar detalles importantes del cliente
- Dejar instrucciones para otro turno
- Registrar acuerdos o promesas hechas
- Alertar sobre clientes difíciles

### Cómo Agregar Notas

1. Haz clic en el ícono 📝 (Sticky Note) en la cabecera
2. Se abre el panel lateral de notas
3. Escribe tu nota y presiona "Agregar"
4. Tu nombre y fecha quedan registrados

### Ejemplos de Notas Útiles

```
✅ "Cliente requiere factura a nombre de empresa. RFC: XXX"
✅ "Prometí llamarle mañana a las 10am para confirmar stock"
✅ "Prefiere contacto por WhatsApp, no llamadas"
✅ "Proyecto grande: nave industrial en Querétaro"
```

---

## Plantillas de Respuesta

### ¿Qué Son?
Mensajes predefinidos para situaciones comunes. Ahorran tiempo y mantienen consistencia.

### Cómo Usar

1. Haz clic en el ícono 📄 (FileText) en la barra de herramientas
2. Selecciona la plantilla deseada
3. El texto se inserta en el campo de mensaje
4. **Personaliza** si es necesario antes de enviar

### Plantillas Recomendadas

| Situación | Plantilla Sugerida |
|-----------|-------------------|
| Primer contacto | Saludo corporativo |
| Pedir información | Solicitud de datos |
| Confirmar pedido | Confirmación de orden |
| Tiempos de entrega | Información de envío |
| Despedida | Agradecimiento y cierre |

> 💡 Los administradores pueden crear nuevas plantillas en `/admin/templates`

---

## Cerrar Conversaciones

### Cuándo Cerrar
- ✅ El cliente confirmó que no necesita más ayuda
- ✅ Se completó la venta
- ✅ El cliente no responde después de 24-48 horas
- ✅ Se resolvió la consulta completamente

### Cómo Cerrar

1. Asegúrate de haber **etiquetado** la conversación
2. Haz clic en el botón **"Cerrar Chat"** (ícono de check ✓)
3. El sistema genera automáticamente un **resumen con IA**
4. La conversación pasa al historial de reportes

### Después del Cierre
- La conversación aparece en `/admin/reports`
- El resumen de IA queda guardado
- Si el cliente escribe de nuevo, se abre una nueva conversación

---

## Mejores Prácticas

### ⏱️ Tiempos de Respuesta

| Prioridad | Tiempo Máximo | Indicador |
|-----------|---------------|-----------|
| Urgente (🔴) | < 5 minutos | Punto rojo parpadeante |
| Normal | < 15 minutos | Sin indicador especial |
| Seguimiento | < 24 horas | Etiqueta "Seguimiento" |

### 💬 Comunicación Efectiva

1. **Saluda siempre** de forma profesional
2. **Identifícate**: "Soy [Tu Nombre] de ELECSA"
3. **Sé conciso**: WhatsApp = mensajes cortos
4. **Usa emojis con moderación**: 1-2 por mensaje máximo
5. **Confirma entendimiento**: "¿Entendí bien que necesitas...?"

### 📋 Organización

1. **Revisa tu lista al iniciar turno**
   - Conversaciones pendientes de tu sucursal
   - Notas dejadas por el turno anterior

2. **Antes de terminar turno**
   - Deja notas en conversaciones activas
   - Etiqueta todo lo posible
   - Cierra lo que se pueda cerrar

3. **Durante el turno**
   - Atiende primero los indicadores rojos 🔴
   - No dejes conversaciones "colgadas"
   - Actualiza etiquetas conforme avanza la conversación

### 🚫 Qué NO Hacer

- ❌ Compartir información personal de clientes
- ❌ Prometer tiempos de entrega sin verificar
- ❌ Dar precios sin confirmar disponibilidad
- ❌ Dejar conversaciones sin atender más de 30 min
- ❌ Discutir con clientes difíciles (escala a supervisor)
- ❌ Enviar información técnica incorrecta

### 🔄 Devolver a la IA

Si la conversación ya no requiere atención humana:
1. Haz clic en **"Retomar IA"**
2. Sofía continuará atendiendo automáticamente
3. Útil para consultas simples que llegaron por error

---

## 🆘 Soporte

### Problemas Técnicos
- Contacta al administrador del sistema
- Reporta errores con capturas de pantalla

### Dudas Operativas
- Consulta con tu supervisor de sucursal
- Revisa la sección de productos en `/admin/products`

### Cambio de Contraseña
- Ve al dashboard y haz clic en **"Mi Contraseña"**
- O solicita al administrador/supervisor

---

## 📊 Tu Desempeño

Las métricas que se registran incluyen:
- Conversaciones atendidas
- Tiempo promedio de respuesta
- Conversaciones cerradas como "Ganado"
- Uso de etiquetas

> 💡 Mantén buenas prácticas para destacar en los reportes de productividad.

---

*Última actualización: Enero 2026*
*Versión: 1.0*
