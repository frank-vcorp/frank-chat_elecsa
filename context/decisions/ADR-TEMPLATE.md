# ADR-XXX: [Título Descriptivo de la Decisión]

**Estado:** Propuesta | Aceptada | Rechazada | Deprecada | Supersedida por ADR-YYY

**Fecha:** YYYY-MM-DD

**Autores:** [Nombre del agente o persona que propone]

**Stakeholders:** [Quiénes se ven afectados por esta decisión]

**Etiquetas:** `#categoria` `#tecnologia` `#componente`

---

## Contexto

[Describe la situación actual y el problema que necesita resolverse. Incluye:]

- **Problema:** ¿Qué necesidad o desafío motivó esta decisión?
- **Contexto del Negocio:** ¿Qué objetivos de negocio están en juego?
- **Restricciones:** ¿Qué limitaciones existen (tiempo, presupuesto, habilidades, tecnología)?
- **Fuerzas:** ¿Qué factores compiten entre sí (performance vs mantenibilidad, costo vs features)?

---

## Decisión

[Declara claramente qué se ha decidido hacer. Usa lenguaje directo:]

**Hemos decidido [DECISIÓN].**

[Luego elabora con más detalle:]

- **Qué:** Descripción técnica de la solución elegida
- **Cómo:** Enfoque de implementación (si es relevante)
- **Cuándo:** Timeline si aplica
- **Quién:** Responsables de la implementación

---

## Alternativas Consideradas

### Alternativa 1: [Nombre]

**Descripción:**
[Breve descripción de esta opción]

**Pros:**
- ✅ [Ventaja 1]
- ✅ [Ventaja 2]

**Contras:**
- ❌ [Desventaja 1]
- ❌ [Desventaja 2]

**Razón del Descarte:**
[Por qué NO se eligió esta opción]

---

### Alternativa 2: [Nombre]

[Repetir estructura]

---

### Alternativa 3: No hacer nada (Status Quo)

**Descripción:**
[Qué pasaría si no se toma ninguna acción]

**Pros:**
- ✅ Sin costo de implementación
- ✅ Sin riesgo de romper cosas

**Contras:**
- ❌ El problema persiste
- ❌ [Otras consecuencias]

**Razón del Descarte:**
[Por qué el status quo no es aceptable]

---

## Consecuencias

### Positivas

- ✅ [Beneficio 1 - con detalle]
- ✅ [Beneficio 2 - con detalle]
- ✅ [Beneficio 3 - con detalle]

### Negativas

- ❌ [Trade-off 1 - qué sacrificamos]
- ❌ [Trade-off 2 - deuda técnica acumulada]
- ❌ [Trade-off 3 - limitaciones futuras]

### Neutras

- ⚪ [Efecto 1 - ni bueno ni malo]
- ⚪ [Efecto 2 - cambio neutral]

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| [Descripción del riesgo 1] | Alta/Media/Baja | Alto/Medio/Bajo | [Cómo lo mitigamos] |
| [Descripción del riesgo 2] | Alta/Media/Baja | Alto/Medio/Bajo | [Cómo lo mitigamos] |

---

## Notas de Implementación

### Pasos de Implementación

1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

### Configuración Necesaria

```bash
# Ejemplo de comandos o configuración
npm install [paquete]
```

```json
// Ejemplo de config file
{
  "setting": "value"
}
```

### Dependencias

- [Librería/servicio 1 - versión]
- [Librería/servicio 2 - versión]

### Testing

- [Cómo testear que la implementación es correcta]
- [Tests específicos a agregar]

---

## Criterios de Éxito

¿Cómo sabremos que esta decisión fue correcta?

- [ ] [Métrica 1 - ej: "Reduce tiempo de build en 30%"]
- [ ] [Métrica 2 - ej: "Aumenta cobertura de tests a >80%"]
- [ ] [Métrica 3 - ej: "Elimina X bugs recurrentes"]

**Fecha de Revisión:** [Cuándo reevaluar si esto funcionó - ej: 3 meses]

---

## Condiciones para Reconsiderar

Esta decisión debería revisarse si:

- [Condición 1 - ej: "El volumen de usuarios crece >10x"]
- [Condición 2 - ej: "Aparece una mejor alternativa madura"]
- [Condición 3 - ej: "Los costos superan $X/mes"]

---

## Referencias

### Documentación Técnica

- [Link a documentación oficial]
- [Link a RFC o especificación]

### Discusiones

- [Link a issue de GitHub]
- [Link a pull request]
- [Link a thread de Slack/email]

### Artículos y Recursos

- [Artículo 1 - título y URL]
- [Artículo 2 - título y URL]

### ADRs Relacionados

- [ADR-XXX: Título relacionado](./ADR-XXX-titulo.md)

---

## Historial de Cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| YYYY-MM-DD | Creación inicial | [Autor] |
| YYYY-MM-DD | Actualización de estado a "Aceptada" | [Autor] |
| YYYY-MM-DD | [Otro cambio significativo] | [Autor] |

---

## Apéndices

### Apéndice A: [Título]

[Información adicional que es demasiado detallada para las secciones principales]

### Apéndice B: Benchmark

| Opción | Métrica 1 | Métrica 2 | Métrica 3 |
|--------|-----------|-----------|-----------|
| Alternativa 1 | valor | valor | valor |
| Alternativa 2 | valor | valor | valor |
| **Decisión** | **valor** | **valor** | **valor** |

---

**Firma:** [Nombre del autor]
**Revisado por:** [Nombres de revisores si aplica]
**Última actualización:** YYYY-MM-DD
