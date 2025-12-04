# Funcionalidades del Dashboard de Chat (v2.0)

Este documento describe las nuevas funcionalidades implementadas en el Dashboard de Chat como parte de la actualización "Opción C: Completa".

## 1. Sistema de Etiquetas (Tags)
Permite clasificar las conversaciones para un mejor seguimiento.
- **Uso**: En la barra de herramientas del chat, clic en el botón "Etiquetar".
- **Opciones**: Nuevo, Interesado, Cotización, Seguimiento, Ganado, Perdido, Recurrente.
- **Visualización**: Las etiquetas activas aparecen en la barra superior y en la lista de conversaciones.
- **Persistencia**: Se guardan en Firestore y son visibles para todos los agentes.

## 2. Notas Internas
Espacio privado para colaboración entre agentes.
- **Acceso**: Clic en el icono de "Nota Adhesiva" (Sticky Note) en la cabecera del chat.
- **Funcionalidad**:
  - Agregar notas de texto.
  - Ver historial de notas con autor y fecha.
  - Eliminar notas (icono de basura).
- **Visibilidad**: Solo visibles para agentes, nunca para el cliente final.

## 3. Plantillas de Respuesta Rápida
Respuestas predefinidas para agilizar la atención.
- **Uso en Chat**: Clic en el icono de "Documento" (FileText) en la barra de herramientas. Seleccionar una plantilla para insertar su texto en el área de mensaje.
- **Gestión (Admin)**:
  - Ir a `/admin/templates` desde el menú lateral.
  - **Crear**: Título y contenido.
  - **Editar**: Clic en el icono de lápiz.
  - **Eliminar**: Clic en el icono de basura.

## 4. Reportes y Resúmenes IA
Herramientas para análisis y gestión histórica.
- **Resumen Automático**: Al cerrar una conversación, la IA genera un resumen breve de lo tratado.
- **Reportes**: Acceder a `/admin/reports`.
  - Muestra las últimas 50 conversaciones cerradas.
  - Incluye: Cliente, Fecha de Cierre, Etiquetas y Resumen IA.
  - **Exportar**: Botón para descargar la tabla en formato CSV.

## 5. Automatización
- **Cierre Automático**: Las conversaciones asignadas a un humano se cierran automáticamente tras 30 minutos de inactividad del agente (si no hay nuevos mensajes).
- **Reasignación**: Botones para "Retomar IA" (devolver a bot) o "Tomar Conversación" (asignar a humano).

## 6. Dashboard de Métricas en Tiempo Real
Panel visual que aparece cuando no hay ninguna conversación seleccionada.
- **Contadores en Vivo**:
  - Conversaciones que requieren atención humana (Prioridad Alta).
  - Total de chats activos.
  - Distribución de carga (IA vs Humanos).
- **Estado del Sistema**: Muestra mensajes sin leer y porcentaje de ocupación de la IA.

## 7. Búsqueda Avanzada y Filtros
Herramientas mejoradas para encontrar conversaciones específicas.
- **Búsqueda de Texto**: Filtra por nombre del contacto.
- **Filtros Avanzados** (Icono de Embudo):
  - **Por Estado**: Todos, Solo Humanos, Solo IA.
  - **Por Etiquetas**: Selecciona una o varias etiquetas para ver solo los chats que coincidan.

## 8. Accesibilidad y Diseño
- **Interfaz "Dark Glass"**: Nuevo diseño moderno con modo oscuro profundo y efectos de transparencia para reducir fatiga visual.
- **Accesibilidad**: Todos los botones interactivos cuentan con etiquetas `aria-label`.
