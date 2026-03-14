# Información de Sucursales ELECSA

# NOTA: Este archivo sirve como plantilla para crear el context_doc en Firestore

# Ejecutar: POST /api/context-docs con este contenido (adaptado)

# FIX REFERENCE: FIX-20250128-01

## Instrucciones

Para que Sofía pueda responder preguntas sobre sucursales sin escalar,
se debe crear un `context_doc` en Firestore con la información real.

### Vía API:

```bash
curl -X POST https://[tu-dominio]/api/context-docs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Información de Sucursales ELECSA",
    "content": "[CONTENIDO ABAJO]",
    "source": "admin"
  }'
```

### Contenido sugerido (COMPLETAR CON DATOS REALES):

```markdown
# Sucursales ELECSA - Información de Contacto

## Horario General

📅 Lunes a Viernes: 8:00 AM - 6:00 PM
📅 Sábados: 8:00 AM - 2:00 PM
📅 Domingos: Cerrado

---

## Querétaro

- 📍 Dirección: [COMPLETAR - Calle, Número, Colonia, CP]
- 📞 Teléfono: [COMPLETAR]
- 📧 Email: queretaro@elecsa.com

## Guadalajara

- 📍 Dirección: [COMPLETAR]
- 📞 Teléfono: [COMPLETAR]
- 📧 Email: guadalajara@elecsa.com

## Monterrey

- 📍 Dirección: [COMPLETAR]
- 📞 Teléfono: [COMPLETAR]
- 📧 Email: monterrey@elecsa.com

## León

- 📍 Dirección: [COMPLETAR]
- 📞 Teléfono: [COMPLETAR]
- 📧 Email: leon@elecsa.com

## San Luis Potosí

- 📍 Dirección: [COMPLETAR]
- 📞 Teléfono: [COMPLETAR]
- 📧 Email: slp@elecsa.com

## Toluca

- 📍 Dirección: [COMPLETAR]
- 📞 Teléfono: [COMPLETAR]
- 📧 Email: toluca@elecsa.com

## Puebla

- 📍 Dirección: [COMPLETAR]
- 📞 Teléfono: [COMPLETAR]
- 📧 Email: puebla@elecsa.com

## Veracruz

- 📍 Dirección: [COMPLETAR]
- 📞 Teléfono: [COMPLETAR]
- 📧 Email: veracruz@elecsa.com

## Coahuila (Torreón/Saltillo)

- 📍 Dirección: [COMPLETAR]
- 📞 Teléfono: [COMPLETAR]
- 📧 Email: coahuila@elecsa.com

## CDMX Centro

- 📍 Dirección: [COMPLETAR]
- 📞 Teléfono: [COMPLETAR]
- 📧 Email: centro@elecsa.com

## CDMX Armas

- 📍 Dirección: [COMPLETAR]
- 📞 Teléfono: [COMPLETAR]
- 📧 Email: armas@elecsa.com

---

## Servicios en todas las sucursales

✅ Venta de material eléctrico
✅ Cotizaciones para proyectos
✅ Envíos a todo México
✅ Atención a mayoristas y minoristas
✅ Asesoría técnica

## Formas de pago

- Efectivo
- Tarjeta de crédito/débito
- Transferencia bancaria
- Crédito (clientes autorizados)
```

---

## Verificación

Una vez creado, verificar que Sofía puede responder:

- "¿Cuál es el horario de la sucursal de Querétaro?"
- "¿Dónde está ubicada la sucursal de Monterrey?"
- "¿Cuál es el teléfono de la sucursal de Guadalajara?"
