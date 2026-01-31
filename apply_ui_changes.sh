#!/bin/bash

# Script para aplicar cambios visuales al Dashboard Layout
# Solo modifica estilos CSS/Tailwind, NO lógica

FILE="apps/web/src/app/dashboard/layout.tsx"

# Reemplazos de colores (solo estilos)
sed -i 's/border-gray-700/border-slate-800/g' "$FILE"
sed -i 's/text-gray-400/text-slate-400/g' "$FILE"
sed -i 's/text-gray-500/text-slate-500/g' "$FILE"
sed -i 's/hover:bg-gray-700/hover:bg-slate-800/g' "$FILE"
sed -i 's/bg-gray-700/bg-slate-800/g' "$FILE"

echo "✅ Cambios visuales aplicados a layout.tsx"
