# DICTAMEN TÉCNICO: Revisión forense del commit UI responsive/PWA 7f00945

- **ID:** FIX-20260409-02
- **Fecha:** 2026-04-09
- **Solicitante:** INTEGRA / Usuario
- **Estado:** ✅ VALIDADO

### A. Análisis de Causa Raíz

El commit 7f00945 mejora estructura responsive, pero introduce regresiones táctiles y de safe area en superficies críticas del shell autenticado. El patrón más riesgoso es mezclar UI mobile-first con interacciones desktop-only: menús del chat dependientes de hover en [apps/web/src/components/ChatWindow.tsx](apps/web/src/components/ChatWindow.tsx), botones que solo aparecen con hover en notas del mismo archivo, y headers móviles que intentan respetar notch usando padding top dentro de un alto fijo en [apps/web/src/app/dashboard/layout.tsx](apps/web/src/app/dashboard/layout.tsx) y [apps/web/src/app/admin/layout.tsx](apps/web/src/app/admin/layout.tsx).

También hay inconsistencia entre la intención de safe areas declarada en [apps/web/src/app/globals.css](apps/web/src/app/globals.css) y su aplicación real. Existen utilidades para top y bottom safe area, pero el panel de notas móvil del chat no las usa, así que el contenido inferior puede quedar demasiado cerca del home indicator en standalone PWA.

Qodo CLI no estuvo disponible en este entorno, así que la segunda opinión automática no pudo ejecutarse.

### B. Justificación de la Solución

No se recomienda rollback completo del commit: la base responsive es aprovechable. Sí se recomienda corregir antes de seguir puliendo UI:

1. Reemplazar `group-hover:block` por estado explícito de apertura compatible con click/touch y accesible por teclado para etiquetas y plantillas en el chat.
2. Hacer visible el affordance de borrado de notas en touch, sin depender de hover.
3. Corregir headers móviles con notch: evitar `h-14` más `paddingTop` dinámico; usar `min-h`, `pt-safe` y padding vertical explícito o calcular altura total correctamente.
4. Aplicar `pb-safe` o desplazamiento inferior equivalente dentro del bottom sheet de notas.
5. Opcional pero recomendable: evitar decidir layout móvil con `window.innerWidth` post-mount; preferir enfoque CSS o media query sincronizada para evitar flash de layout equivocado.

### C. Instrucciones de Handoff para INTEGRA

1. Tratar como P0 la corrección de interacciones táctiles del chat antes de declarar paridad mobile-first.
2. Validar manualmente en iPhone/Android con notch y en modo PWA standalone los headers de dashboard/admin y el sheet de notas.
3. Si se abre un fix, mantener el alcance acotado a interacción móvil y safe areas; no mezclar con cambios de negocio.
4. Considerar un smoke test UAT centrado en: abrir menú, etiquetar conversación, usar plantillas, abrir notas, guardar nota y eliminar nota desde móvil.