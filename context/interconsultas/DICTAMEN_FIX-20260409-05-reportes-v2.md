# DICTAMEN TÉCNICO: Riesgos y alcance mínimo para Reportes v2

- **ID:** FIX-20260409-05
- **Fecha:** 2026-04-09
- **Solicitante:** INTEGRA / Usuario
- **Estado:** VALIDADO

## Causa raíz

El módulo actual de reportes no está construido sobre un contrato histórico confiable, sino sobre una consulta operativa reducida. Usa `lastMessageAt` como proxy de cierre, limita la lectura a 50 conversaciones y renderiza directamente el documento de conversación sin una capa de lectura diseñada para reporteo.

## Blockers reales

1. `closedAt` no está formalizado en el tipo principal de conversación para el frontend.
2. Existe ambigüedad de cierre/reapertura y doble escritura potencial de resumen, lo que desaconseja prometer analítica avanzada en esta fase.
3. Repetir filtrado masivo en cliente sería escalar una mala práctica y elevar el costo de Firestore.

## Recomendación

- Reconstruir Reportes v2 como lectura histórica server-side.
- Usar `closedAt` como pivote obligatorio.
- Limitar V1 a filtros reales, paginación, exportación coherente y KPIs básicos.
- Evitar joins con `contacts` y usar `displayName || contactId`.

## Guardrails para SOFIA

1. No usar `lastMessageAt` como fecha de cierre.
2. No conservar `limit(50)` como base del módulo.
3. No exportar el arreglo ya cargado en cliente.
4. No prometer analítica avanzada mientras reaperturas y doble resumen sigan siendo deuda aparte.