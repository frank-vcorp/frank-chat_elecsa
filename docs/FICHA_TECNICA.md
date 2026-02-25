# Ficha Técnica: Sofía - Inteligencia Agéntica Elecsa

## 🏗️ Arquitectura del Sistema
Sistema de IA conversacional de alto rendimiento diseñado para WhatsApp, utilizando una arquitectura de **Generación Aumentada por Recuperación (RAG)** y **Bucles de Razonamiento**.

### Stack Tecnológico
- **Frontend/Backend:** Next.js 14+ (Edge Runtime compatible).
- **IA Core:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) vía Anthropic SDK.
- **Base de Datos:** Firebase Firestore (Persistencia de historial y metadatos).
- **Motor de Búsqueda:** MiniSearch (Indexación en memoria RAM para 12k+ productos).
- **Canal:** Twilio WhatsApp Business API.

### Componentes Críticos
1. **Razonamiento Recursivo (Reasoning Loop):** La IA no responde de inmediato; ejecuta un bucle de hasta 5 iteraciones donde puede consultar el catálogo, analizar resultados y refinar su búsqueda antes de emitir una respuesta final.
2. **Buscador Local (RAM Index):** Evita latencias de base de datos al mantener el catálogo de productos indexado en memoria, permitiendo búsquedas *fuzzy* (tolerantes a errores ortográficos).
3. **Sistema de Semáforos:** Lógica de handoff automatizada que detecta palabras clave y sentimientos para escalar la conversación a un humano en la sucursal correcta según la ciudad detectada.

### Seguridad y Eficiencia
- **Blindaje de Endpoints:** Validación por Firebase ID Token en la carga masiva de catálogos.
- **Optimización de Costos:** Uso de Haiku 4.5 para maximizar la velocidad y minimizar el costo por mensaje, manteniendo capacidades de *Function Calling* superiores.
