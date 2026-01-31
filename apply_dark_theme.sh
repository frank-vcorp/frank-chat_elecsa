#!/bin/bash

# Script para aplicar tema dark premium a componentes
# Solo modifica estilos CSS/Tailwind, NO lógica

echo "Aplicando tema dark premium a componentes..."

# ChatList
FILE="apps/web/src/components/ChatList.tsx"
if [ -f "$FILE" ]; then
    sed -i 's/bg-white/bg-slate-900\/95/g' "$FILE"
    sed -i 's/bg-gray-50/bg-slate-950/g' "$FILE"
    sed -i 's/bg-gray-100/bg-slate-800\/50/g' "$FILE"
    sed -i 's/border-gray-200/border-slate-800\/50/g' "$FILE"
    sed -i 's/text-gray-600/text-slate-400/g' "$FILE"
    sed -i 's/text-gray-500/text-slate-500/g' "$FILE"
    sed -i 's/text-gray-700/text-slate-300/g' "$FILE"
    sed -i 's/text-gray-900/text-white/g' "$FILE"
    sed -i 's/hover:bg-gray-50/hover:bg-slate-800\/30/g' "$FILE"
    echo "✅ ChatList.tsx actualizado"
fi

# ChatWindow
FILE="apps/web/src/components/ChatWindow.tsx"
if [ -f "$FILE" ]; then
    sed -i 's/bg-white/bg-slate-900\/95/g' "$FILE"
    sed -i 's/bg-gray-50/bg-slate-950/g' "$FILE"
    sed -i 's/bg-gray-100/bg-slate-800\/50/g' "$FILE"
    sed -i 's/border-gray-200/border-slate-800\/50/g' "$FILE"
    sed -i 's/text-gray-600/text-slate-400/g' "$FILE"
    sed -i 's/text-gray-500/text-slate-500/g' "$FILE"
    sed -i 's/text-gray-700/text-slate-300/g' "$FILE"
    sed -i 's/text-gray-900/text-white/g' "$FILE"
    sed -i 's/hover:bg-gray-50/hover:bg-slate-800\/30/g' "$FILE"
    echo "✅ ChatWindow.tsx actualizado"
fi

# StatusBar
FILE="apps/web/src/components/StatusBar.tsx"
if [ -f "$FILE" ]; then
    sed -i 's/bg-white/bg-slate-900\/95/g' "$FILE"
    sed -i 's/bg-gray-50/bg-slate-950/g' "$FILE"
    sed -i 's/bg-gray-100/bg-slate-800\/50/g' "$FILE"
    sed -i 's/border-gray-200/border-slate-800\/50/g' "$FILE"
    sed -i 's/text-gray-600/text-slate-400/g' "$FILE"
    sed -i 's/text-gray-500/text-slate-500/g' "$FILE"
    sed -i 's/text-gray-700/text-slate-300/g' "$FILE"
    sed -i 's/text-gray-900/text-white/g' "$FILE"
    echo "✅ StatusBar.tsx actualizado"
fi

# Dashboard page
FILE="apps/web/src/app/dashboard/page.tsx"
if [ -f "$FILE" ]; then
    sed -i 's/bg-white/bg-slate-900\/95/g' "$FILE"
    sed -i 's/bg-gray-50/bg-slate-950/g' "$FILE"
    sed -i 's/bg-gray-100/bg-slate-800\/50/g' "$FILE"
    sed -i 's/border-gray-200/border-slate-800\/50/g' "$FILE"
    sed -i 's/text-gray-600/text-slate-400/g' "$FILE"
    sed -i 's/text-gray-500/text-slate-500/g' "$FILE"
    sed -i 's/text-gray-700/text-slate-300/g' "$FILE"
    sed -i 's/text-gray-900/text-white/g' "$FILE"
    echo "✅ Dashboard page.tsx actualizado"
fi

echo ""
echo "✨ Tema dark premium aplicado exitosamente"
