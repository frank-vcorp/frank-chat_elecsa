# 🧪 Guía de Pruebas de Usuario (UAT) - Sofía v3.1

**Para:** Equipo ELECSA
**Objetivo:** Validar que Sofía actúe como un "Filtro Inteligente" y que las alertas lleguen correctamente a las sucursales.

---

## 🚦 1. Prueba de "Semáforos" (Inteligencia de Negocio)

El objetivo es verificar que Sofía clasifique correctamente la intención del cliente.

### Escenario A: Semáforo VERDE 🟢 (Venta Rápida)

- **Mensaje de Cliente:** "Hola, precio del cable calibre 12 marca Indio"
- **Comportamiento Esperado:**
  1.  Sofía da el precio (orientativo + IVA).
  2.  Sofía pregunta: "¿Qué cantidad necesitas y en qué ciudad estás?".
  3.  **Dashboard:** El chat permanece en la bandeja de entrada normal.

### Escenario B: Semáforo AMARILLO 🟡 (Cotización Compleja)

- **Mensaje de Cliente:** "Necesito cotizar un transformador de 500kVA y todo el material para una subestación nueva."
- **Comportamiento Esperado:**
  1.  Sofía detecta que es un proyecto grande/especial.
  2.  Responde: "Al ser un equipo especializado, te integro con un asesor técnico."
  3.  **Dashboard:** Se marca con una etiqueta amarilla o alerta de "Oportunidad".

### Escenario C: Semáforo ROJO 🔴 (Queja/Admin)

- **Mensaje de Cliente:** "Llevo 3 días esperando mi factura y nadie me contesta. Pésimo servicio."
- **Comportamiento Esperado:**
  1.  Sofía detecta frustración.
  2.  Responde con empatía y ofrece conectar con humano.
  3.  **Dashboard:** Se activa la alerta **"Needs Human"** (Barra Roja parpadeando).

---

## 🔍 1.5. Prueba de "Catálogo Real" (NUEVO v3.1)

El objetivo es validar que Sofía consulte el inventario real de 12,334 productos.

### Escenario A: Búsqueda Exacta

- **Mensaje de Cliente:** "¿Tienen el interruptor Schneider de 20A?"
- **Comportamiento Esperado:**
  1.  Sofía activa la herramienta de búsqueda.
  2.  Da el precio real y SKU del catálogo.
  3.  Menciona: "Los precios son orientativos y el stock cambia rápido".

### Escenario B: Búsqueda con Error (Fuzzy)

- **Mensaje de Cliente:** "Busco un taldro trupe" (con errores).
- **Comportamiento Esperado:**
  1.  Sofía identifica que buscas "Taladro Truper".
  2.  Muestra opciones de taladros disponibles.

### Escenario C: Búsqueda Recursiva (Razonamiento)

- **Mensaje de Cliente:** "Busco interruptores Schneider de 30A... pero si no tienes, dime cuáles tienes de ABB."
- **Comportamiento Esperado:** 1. Sofía busca Schneider. Si no encuentra o desea comparar, busca ABB. 2. Responde con la comparativa de lo que SI hay en inventario.
  El objetivo es probar la nueva función de "Monitor Silencioso".

**Pasos:**

1.  Abre el Dashboard de Agente (con el volumen encendido 🔊).
2.  Desde un celular (WhatsApp) escribe: _"Hola, soy de **Querétaro** y busco cable."_
3.  **Lo que debe pasar EN EL DASHBOARD:**
    - 🔊 Suena la campana ("Ding").
    - 🔴 La barra superior parpadea en Rojo/Naranja.
    - El chat se asigna automáticamente a la columna de **Querétaro**.
    - **IMPORTANTE:** Sofía **SIGUE CONTESTANDO**. No se detiene.
    - _Tú como agente solo observas ("monitor") y entras si es necesario._

---

## 📍 3. Prueba de Ubicación (Detección Crítica)

El objetivo es asegurar que Sofía siempre obtenga la ciudad para asignarle sucursal.

### Caso 1: Usuario NO dice ciudad

- **Cliente:** "Hola, precio de la tubería conduit."
- **Sofía:** Debe dar el precio Y PREGUNTAR: _"¿En qué ciudad te ubicas para revisar existencia?"_
- _(Nota: Si no lo pregunta, es un error)._

### Caso 2: Usuario SÍ dice ciudad

- **Cliente:** "Hola, estoy en **León**, ¿tienen apagadores?"
- **Sofía:** Debe confirmar: _"Perfecto, revisamos disponibilidad en León..."_
- _(Nota: No debe volver a preguntar "¿De dónde eres?")._

---

## ✅ Checklist de Validación

Marcar confirmación por sucursal:

| Prueba                   | GDL | MTY | QRO | SLP | LEÓN | CDMX |
| :----------------------- | :-: | :-: | :-: | :-: | :--: | :--: |
| Semáforo Verde           | [ ] | [ ] | [ ] | [ ] | [ ]  | [ ]  |
| Semáforo Rojo            | [ ] | [ ] | [ ] | [ ] | [ ]  | [ ]  |
| Búsqueda Catálogo (v3.1) | [ ] | [ ] | [ ] | [ ] | [ ]  | [ ]  |
| Alerta de Audio 🔊       | [ ] | [ ] | [ ] | [ ] | [ ]  | [ ]  |
| Detección Ciudad         | [ ] | [ ] | [ ] | [ ] | [ ]  | [ ]  |

---

_Cualquier comportamiento extraño, reportarlo con captura de pantalla._
