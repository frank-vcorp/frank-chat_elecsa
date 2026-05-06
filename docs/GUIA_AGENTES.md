# Guía Operativa para Agentes - Dashboard de Chat ELECSA

## Objetivo

Este manual explica cómo trabajar en el dashboard de chat de ELECSA, cómo interpretar las alertas, cómo tomar conversaciones y qué hacer cuando Sofía escala un cliente a atención humana.

Está pensado para:

- agentes humanos de sucursal
- personal de apoyo comercial que atiende leads desde el dashboard

---

## 1. Acceso al sistema

### Primer ingreso

1. Entra a la URL del dashboard que te proporcionó tu supervisor.
2. Inicia sesión con tu correo y contraseña temporal.
3. Si el sistema te pide cambio de contraseña, complétalo de inmediato.

### Inicio normal

1. Ve a la pantalla de login.
2. Escribe tu correo y contraseña.
3. Al entrar verás la lista de conversaciones y el panel del chat.

Si no puedes entrar, contacta a tu supervisor o al administrador.

---

## 2. Qué ves en el dashboard

El dashboard tiene dos zonas principales:

- columna izquierda: lista de conversaciones
- panel derecho: detalle del chat seleccionado

Además, verás alertas visuales y de sonido cuando una conversación necesite humano.

### Indicadores principales

| Indicador | Significado |
| --- | --- |
| Punto rojo parpadeante | La conversación necesita atención humana |
| Badge azul con número | Hay mensajes sin leer |
| Badge verde con nombre | Ya hay un agente asignado |
| Badge teal con sucursal | Sucursal detectada del cliente |
| Badge verde “WhatsApp” | La conversación fue canalizada por WhatsApp a agentes |
| Barra inferior roja/naranja | Hay conversaciones pendientes de atención humana |

### Cómo leer la pantalla principal

Cuando abras el dashboard, interpreta la pantalla en este orden:

1. menú lateral: confirma que estás en Conversaciones
2. buscador: localiza clientes por nombre o número
3. lista de conversaciones: identifica primero las que tengan alertas o no leídos
4. badge de sucursal: confirma si el chat corresponde a tu zona
5. badge de agente asignado: verifica si ya hay un responsable atendiendo
6. badge de WhatsApp: indica que hubo canalización adicional por WhatsApp a agentes
7. panel derecho: muestra el historial completo de la conversación abierta
8. botones de acción: desde aquí puedes tomar la conversación, retomar IA o cerrar, según el caso
9. barra inferior: resume cuántas conversaciones activas, sin leer y con atención humana hay en este momento

### Qué debes revisar antes de responder

Antes de escribir al cliente, valida estas tres cosas:

1. si el chat es de tu sucursal
2. si ya tiene agente asignado
3. si Sofía ya pidió o recibió datos importantes

---

## 3. Cómo llegan las conversaciones

No todas las conversaciones llegan igual.

### Cómo trabaja Sofía antes de escalar

Sofía intenta resolver sola todo lo que sí puede atender sin riesgo. Antes de pasarte una conversación, primero hace estas validaciones:

1. entiende qué necesita el cliente
2. identifica si la consulta es simple o si requiere humano
3. intenta detectar ciudad, estado o sucursal
4. si hay archivo, imagen, urgencia o solicitud directa de humano, prepara el handoff

Como agente, esto significa que muchas veces cuando el chat te llega ya trae contexto previo y no estás entrando desde cero.

### Caso A: Sofía resuelve sola

Si la consulta es simple, Sofía sigue atendiendo y no necesitas intervenir.

Ejemplos:

- preguntas generales
- saludo inicial
- consulta simple de producto
- dudas básicas de horarios o ubicación

### Caso B: Sofía escala a humano

Cuando el cliente necesita atención humana:

- el chat se marca con alerta
- suena una notificación
- se detecta la sucursal si el sistema puede hacerlo
- se notifica a los agentes de la sucursal por dashboard y, si aplica, por WhatsApp

Esto suele pasar cuando:

- el cliente pide cotización formal
- manda PDF o imagen para revisar material
- pide hablar con una persona
- tiene una urgencia o un caso fuera del alcance de Sofía
- hay una queja, seguimiento delicado o caso comercial importante

### Flujo real de escalación

Cuando Sofía decide escalar, el sistema sigue este orden:

1. Detecta que la conversación ya necesita humano.
2. Intenta identificar la sucursal correcta con ciudad, estado o abreviatura.
3. Si sí encuentra sucursal:
	- marca la conversación como atención humana
	- enciende la alerta en el dashboard
	- puede mandar aviso por WhatsApp a los agentes de esa sucursal
4. Si no encuentra sucursal confiable:
	- no escala todavía
	- le pregunta al cliente qué sucursal le queda mejor o le pide confirmar ciudad/estado
5. Cuando el cliente responde con una ubicación reconocida, entonces sí se canaliza correctamente.

### Qué ve el agente cuando Sofía sí logró escalar bien

Normalmente verás esto:

- punto rojo en la conversación
- barra inferior con alerta
- badge de sucursal
- nombre del agente asignado o conversación lista para tomar
- en algunos casos, badge de WhatsApp si también se notificó por ese medio

### Caso C: El sistema no sabe qué sucursal elegir

Si el cliente menciona una ciudad ambigua o no reconocida, ahora el sistema ya no se queda en silencio. Sofía le preguntará al cliente cuál sucursal le queda mejor o le pedirá confirmar su ciudad/estado antes de escalar correctamente.

Esto evita asignaciones incorrectas.

Como agente, aquí no debes intervenir de inmediato salvo que el caso ya te haya sido asignado manualmente. El sistema está esperando que el cliente aclare su zona para enviarlo a la sucursal correcta.

### Caso D: Estado sin sucursal directa

Si el cliente escribe desde una zona donde no hay sucursal física directa, Sofía puede proponerle opciones cercanas.

Ejemplo:

- el cliente menciona un estado cubierto por otra sucursal
- Sofía le ofrece una o dos sucursales viables
- el handoff se hace cuando el cliente confirma cuál prefiere

### Qué debe hacer el agente cuando entra por escalación

Cuando abras un chat escalado por Sofía:

1. lee los últimos mensajes antes de responder
2. revisa si el cliente ya compartió archivo o contexto técnico
3. confirma sucursal y responsable
4. responde como humano sin repetir preguntas que Sofía ya hizo, salvo que necesites confirmar algo clave
5. si el cliente sigue ambiguo, guía la conversación para cerrar datos de cotización o ubicación

---

## 4. Qué debe hacer un agente cuando entra una alerta

1. Revisa primero las conversaciones con alerta roja.
2. Abre la conversación.
3. Lee los últimos mensajes del cliente y cualquier nota interna.
4. Si vas a atenderla tú, haz clic en Tomar Conversación.
5. Responde como asesor humano.

Cuando tomas la conversación:

- la alerta roja debe apagarse
- el sonido deja de repetirse para ese caso
- tu nombre aparece como agente asignado

---

## 5. Cómo tomar una conversación

1. Abre la conversación.
2. Haz clic en Tomar Conversación.
3. El sistema te asigna esa conversación.

Si ya aparece el nombre de otro agente asignado, verifica primero si esa persona ya la está atendiendo antes de intervenir.

### Si la conversación ya la atiende otro agente

Como agente operativo, no debes mover manualmente la conversación a otro asesor desde tu flujo normal.

Si ves que:

- el responsable actual no corresponde
- la sucursal es incorrecta
- el chat te llegó por error

entonces lo correcto es:

1. no duplicar atención al cliente
2. reportarlo para que se reasigne correctamente
3. solo intervenir si te indican expresamente que tú debes tomar el caso

---

## 6. Cómo responder al cliente

### Mensaje normal

1. Escribe en el campo inferior.
2. Presiona Enter o el botón de enviar.

### Archivos e imágenes

Puedes adjuntar:

- imágenes
- PDF
- documentos comunes

Recomendación:

- si envías cotización, menciona qué contiene el archivo
- si el cliente adjunta un archivo, léelo antes de responder

### Respuestas rápidas

Usa el botón de respuestas rápidas cuando necesites:

- saludar
- pedir tiempo
- confirmar recepción
- cerrar cordialmente

Personaliza el mensaje antes de enviarlo si hace falta.

---

## 7. Notas internas

Las notas internas son visibles solo para el equipo. El cliente no las ve.

Úsalas para:

- dejar contexto al siguiente turno
- anotar acuerdos
- registrar datos importantes del cliente
- advertir temas pendientes

### Buenas notas

- Cliente requiere factura con RFC confirmado.
- Pidió seguimiento mañana por la tarde.
- Proyecto industrial; pasar con asesor técnico si responde.
- Está comparando con otra cotización.

### Reglas

- escribe claro y breve
- no repitas el chat completo
- registra solo lo útil para la operación

---

## 8. Etiquetas

Las etiquetas sirven para clasificar oportunidades y facilitar seguimiento y reportes.

### Etiquetas disponibles

| Etiqueta | Uso recomendado |
| --- | --- |
| Nuevo | Primer contacto |
| Interesado | Hay interés real en compra |
| Cotización | Ya pidió precios o propuesta |
| Seguimiento | Hay que volver a contactar |
| Ganado | Venta concretada |
| Perdido | No se cerró la venta |
| Recurrente | Cliente frecuente |

### Regla práctica

No cierres conversaciones importantes sin al menos una etiqueta útil.

---

## 9. Cerrar una conversación

Debes cerrar una conversación cuando:

- el cliente ya fue atendido
- la duda quedó resuelta
- la venta terminó o se perdió claramente
- ya no hay acción pendiente inmediata

### Qué sucede al cerrar

- la conversación pasa a estado cerrado
- se apagan alertas pendientes
- desaparece del listado principal de activas
- el sistema puede generar un resumen automático

### Recomendación antes de cerrar

1. verifica si hace falta una nota
2. agrega etiqueta final
3. confirma que no quede nada pendiente para otro agente

---

## 10. Retomar IA

Si una conversación fue tomada por humano pero ya no necesita seguimiento manual, puedes usar Retomar IA.

Úsalo solo cuando:

- la consulta volvió a algo simple
- Sofía puede continuar sin riesgo
- no hay negociación, queja o seguimiento delicado

No lo uses si:

- el cliente está molesto
- hay una promesa comercial en curso
- la conversación ya está en cierre de venta delicado

---

## 11. Cómo se decide la sucursal

El sistema intenta detectar la sucursal usando la ciudad, estado o una abreviatura reconocida.

Ejemplos válidos:

- mty → Monterrey
- gdl → Guadalajara
- qro → Querétaro
- slp → San Luis Potosí
- cdmx → CDMX Centro

Si la ciudad no se reconoce:

- Sofía preguntará al cliente qué sucursal le queda mejor
- el handoff se retrasa hasta que el cliente confirme su zona

Esto es correcto y deseable. Es mejor confirmar que asignar mal.

---

## 12. Notificaciones y sonidos

### Qué significan

- sonido nuevo: entró una conversación relevante o aumentó la urgencia
- repetición de sonido: sigue existiendo al menos una conversación pendiente de atención humana

### Cuándo deben detenerse

El sonido y la alerta deben detenerse cuando:

- una conversación es tomada por humano
- una conversación es asignada correctamente
- una conversación se cierra

Si esto no ocurre, repórtalo con captura y número de conversación.

---

## 13. Qué hacer si llega aviso por WhatsApp

El aviso por WhatsApp existe para que el agente se entere aunque no esté logueado.

Si recibes un aviso:

1. entra al dashboard
2. abre la conversación indicada
3. toma la conversación si te corresponde
4. revisa sucursal, notas y contexto antes de responder

Si recibes un aviso de una sucursal que no te corresponde, repórtalo para que lo reasignen correctamente.

No respondas por duplicado si ya ves otro agente asignado en el dashboard.

---

## 14. Buenas prácticas operativas

### Al iniciar turno

1. revisa conversaciones activas de tu sucursal
2. revisa notas pendientes
3. identifica seguimientos del turno anterior

### Durante el turno

1. atiende primero lo rojo
2. no dejes conversaciones sin responsable
3. documenta con notas lo que otro agente deba saber
4. etiqueta conforme avanza la oportunidad

### Al terminar turno

1. deja notas en casos abiertos
2. cierra lo que ya terminó
3. marca seguimiento donde aplique

---

## 15. Qué no hacer

- no prometer inventario o entrega sin confirmación
- no discutir con clientes molestos; escala a supervisor
- no dejar conversaciones urgentes sin responsable
- no usar etiquetas al azar
- no cerrar un chat si todavía hay un compromiso pendiente
- no compartir datos internos en el mensaje al cliente

---

## 16. Soporte y reporte de problemas

Si detectas un problema técnico, reporta:

1. número del cliente o nombre visible
2. hora aproximada
3. sucursal esperada
4. qué ocurrió realmente
5. captura de pantalla si es posible

Ejemplos de incidencias útiles:

- no sonó la alerta
- siguió sonando después de tomar el chat
- no llegó el aviso por WhatsApp
- la sucursal se detectó mal
- no puedo abrir un PDF o imagen

---

## Resumen operativo

Si lo reduces a lo esencial, el trabajo del agente es este:

1. detectar alertas
2. abrir la conversación correcta
3. tomar la conversación si te corresponde
4. responder con contexto
5. dejar nota y etiqueta
6. cerrar cuando termine

---

Última actualización: Mayo 2026
Versión: 2.0
