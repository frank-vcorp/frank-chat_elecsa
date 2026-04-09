# HANDOFF ARCH-20260409-02

## Tarea

Implementación autónoma de la SPEC responsive/PWA de la UI autenticada:

- [context/SPECs/SPEC-ARCH-20260409-02-ui-pwa-mobile-first.md](context/SPECs/SPEC-ARCH-20260409-02-ui-pwa-mobile-first.md)

## Regla de Alcance

Trabajo estrictamente orientado a UI. No tocar negocio, reglas operativas, autenticación, APIs ni estructura de datos.

## Reparto

### SOFIA - Builder

- Responsable principal de implementación.
- Entrega por fases:
  1. shell responsive compartido
  2. dashboard conversacional responsive
  3. admin crítico responsive
- Debe preservar paridad funcional y no introducir cambios de negocio.
- Debe usar revisión propia antes de cerrar fase.

### Deby

- Interconsulta correctiva únicamente.
- Trigger:
  - mismo bug de UI repetido 2 veces
  - overlay roto
  - pérdida de estado visual
  - comportamiento inconsistente entre breakpoints
- Su salida debe ser dictamen corto de causa raíz y propuesta de corrección.

### Gemini

- Auditoría de calidad y cierre.
- Revisa:
  - responsive real en móvil, tablet y PC
  - safe areas y PWA standalone
  - accesibilidad básica
  - aprovechamiento del ancho en escritorio
  - ausencia de regresiones visuales fuertes

## Guardrails

- No reabrir alcance de producto.
- No introducir nuevas features.
- No alterar contratos de API.
- No tocar seguridad ni permisos.
- No convertir el trabajo en refactor general del sistema.

## Criterio de Éxito

La app debe verse y sentirse correcta en móvil y PC, manteniendo la misma funcionalidad existente, con mejora clara de layout, navegación y ergonomía sin cambios de negocio.