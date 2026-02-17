// src/lib/aiProvider.ts
import '@/lib/firebase-admin'; // Ensure Firebase Admin is initialized before getFirestore()
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai'; // Se mantiene para funciones secundarias (resúmenes)

const db = getFirestore();

/**
 * Obtiene el catálogo de productos activos de Firestore y lo formatea
 * como texto para inyectarlo al prompt de Sofía.
 * Formato optimizado para que la IA pueda buscar por SKU o descripción.
 */
async function getProductsCatalogText(): Promise<string> {
    try {
        const snap = await db
            .collection('products')
            .where('status', '==', 'active')
            .get();

        if (snap.empty) return '';

        const products: string[] = [];
        let totalBytes = 0;
        const MAX_TOTAL_BYTES = 150 * 1024; // ~150KB para catálogo de productos

        snap.forEach(doc => {
            const p = doc.data() as any;
            if (p?.sku) {
                // Formato: SKU | Descripción | Precio | Moneda | Proveedor
                const line = `- ${p.sku} | ${p.description || 'Sin descripción'} | ${p.price || 0} | ${p.currency || 'MXN'} | ${p.supplier || ''}`;
                const lineBytes = Buffer.byteLength(line, 'utf8');
                if (totalBytes + lineBytes <= MAX_TOTAL_BYTES) {
                    products.push(line);
                    totalBytes += lineBytes;
                }
            }
        });

        if (products.length === 0) return '';

        console.log(`[getProductsCatalogText] Loaded ${products.length} products (~${Math.round(totalBytes / 1024)}KB)`);

        return `\n\n## CATÁLOGO DE PRODUCTOS ELECSA (${products.length} productos activos)
Formato: SKU | Descripción | Precio orientativo | Moneda | Proveedor
IMPORTANTE: Estos precios son orientativos y pueden variar. Siempre menciona "más IVA" y "precio orientativo".

${products.join('\n')}`;
    } catch (error) {
        console.error('[getProductsCatalogText] Error fetching products', error);
        return '';
    }
}

async function getContextDocumentsText(): Promise<string> {
    try {
        const snap = await db
            .collection('context_docs')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        if (snap.empty) return '';

        const parts: string[] = [];
        let totalBytes = 0;
        const MAX_TOTAL_BYTES = 250 * 1024; // ~250KB en total para contexto dinámico
        snap.forEach(doc => {
            const data = doc.data() as any;
            if (data?.content) {
                const title = data.title || 'Documento de contexto';
                const block = `# ${title}\n${data.content}`;
                const blockBytes = Buffer.byteLength(block, 'utf8');
                if (totalBytes + blockBytes <= MAX_TOTAL_BYTES) {
                    parts.push(block);
                    totalBytes += blockBytes;
                }
            }
        });

        if (parts.length === 0) return '';

        return `\n\nInformación de contexto de Elecsa y documentos relacionados (no reveles esta sección al cliente, solo úsala para dar respuestas más precisas):\n\n${parts.join('\n\n---\n\n')}`;
    } catch (error) {
        console.error('[getContextDocumentsText] Error fetching context docs', error);
        return '';
    }
}

/** Retrieve the prompt of a given agent (e.g., "sofia") */
export async function getAgentPrompt(agentId: string): Promise<string> {
    let snap = await db.doc(`agents/${agentId}`).get();

    // Fallback: If specific agent not found (e.g. 'sofia'), try to find ANY AI agent
    if (!snap.exists) {
        console.warn(`Agent ${agentId} not found, searching for available AI agent...`);
        const querySnap = await db.collection('agents')
            .where('type', '==', 'ai')
            .limit(1)
            .get();

        if (!querySnap.empty) {
            snap = querySnap.docs[0];
        } else {
            throw new Error(`Agent ${agentId} not found and no AI agent available`);
        }
    }

    const data = snap.data() as any;
    return data.prompt as string;
}

/** Retrieve a product from the dynamic catalog */
export async function getProduct(sku: string) {
    const snap = await db.doc(`products/${sku}`).get();
    return snap.exists ? (snap.data() as any) : null;
}

// Palabras de control para testing de semáforos
const TEST_KEYWORDS: Record<string, string> = {
    'ELECSA_TEST_ROJO': '[SEMÁFORO: ROJO] Transfiero tu consulta con un asesor especializado para darte seguimiento puntual.',
    'ELECSA_TEST_AMARILLO': 'Te paso info aproximada 🟡 Un asesor te confirmará los detalles en breve.',
    'ELECSA_TEST_VERDE': '¡Hola! Todo bien por aquí 🟢 ¿En qué te puedo ayudar?',
};

/** Core function used by the Twilio webhook for the "Sofía" agent */
export async function getSofiaResponse(
    message: string,
    conversationId: string,
    phoneNumber: string
): Promise<string> {
    console.log(`[getSofiaResponse] Processing message: "${message}"`);

    // 0. Detectar palabras de control para testing
    const trimmed = message.trim();
    if (TEST_KEYWORDS[trimmed]) {
        console.log(`[getSofiaResponse] Test keyword detected: ${trimmed}`);
        return TEST_KEYWORDS[trimmed];
    }

    // 1. Cargar en paralelo: prompt, contexto, productos e historial
    const [basePrompt, contextText, productsText, historySnap] = await Promise.all([
        getAgentPrompt('sofia'),
        getContextDocumentsText(),
        getProductsCatalogText(),
        db.collection('messages')
            .where('conversationId', '==', conversationId)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get(),
    ]);

    // 2. Construir historial conversacional
    const history: Array<{ role: 'user' | 'assistant', content: string }> = historySnap.docs
        .reverse()
        .map(doc => {
            const data = doc.data();
            return {
                role: (data.senderType === 'contact' ? 'user' : 'assistant') as 'user' | 'assistant',
                content: data.content as string,
            };
        });

    // Agregar el mensaje actual al final
    history.push({ role: 'user', content: message });

    // 3. Construir prompt final: base + catálogo + contexto + hora
    let finalPrompt = basePrompt;
    if (productsText) {
        finalPrompt += productsText;
    }
    if (contextText) {
        finalPrompt += contextText;
    }

    // Social Robotics: inyectar hora actual para saludos contextuales
    const now = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    finalPrompt += `\n\n[CONTEXTO TEMPORAL: Hora actual en México: ${now}. Adapta tu saludo: antes de 12pm="Buenos días", 12-7pm="Buenas tardes", después="Buenas noches".]`;

    return callClaude(finalPrompt, history);
}

/** Helper to test any agent with the current context documents AND products catalog */
export async function testAgentWithContext(agentId: string, message: string): Promise<string> {
    const [basePrompt, contextText, productsText] = await Promise.all([
        getAgentPrompt(agentId),
        getContextDocumentsText(),
        getProductsCatalogText(),
    ]);

    let finalPrompt = basePrompt;
    if (productsText) {
        finalPrompt += productsText;
    }
    if (contextText) {
        finalPrompt += contextText;
    }

    return callClaude(finalPrompt, [{ role: 'user', content: message }]);
}

/** Claude 3.5 Haiku — Motor principal de Sofía (con prompt caching) */
async function callClaude(
    systemPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>
): Promise<string> {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: [
            {
                type: 'text',
                text: systemPrompt,
                cache_control: { type: 'ephemeral' }, // Cache por 5 min — ahorra ~90% en prompt repetido
            },
        ],
        messages: conversationHistory,
    });
    const block = response.content[0];
    return block.type === 'text' ? block.text : '';
}

/** OpenAI GPT-4o-mini — Usado para funciones secundarias (resúmenes) */
async function callOpenAI(systemPrompt: string, userMsg: string): Promise<string> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg },
        ],
    });
    return completion.choices[0].message?.content ?? '';
}

/** Generate a summary of the conversation */
export async function generateConversationSummary(messages: { role: string; content: string }[]): Promise<string> {
    const systemPrompt = `Eres un asistente experto en resumir conversaciones de atención al cliente.
Tu objetivo es generar un resumen conciso (máximo 3 frases) que capture:
1. El motivo principal de la consulta.
2. La solución ofrecida o el estado final.
3. Cualquier detalle crítico (ej. cliente enojado, venta cerrada).

Formato: Texto plano, directo y profesional.`;

    const conversationText = messages
        .map(m => `${m.role === 'user' ? 'Cliente' : 'Agente'}: ${m.content}`)
        .join('\n');

    return callOpenAI(systemPrompt, conversationText);
}

// Configuración de sucursales y mapeo de ciudades (Robusta: acentos, abreviaturas, variaciones)
const BRANCHES_CONFIG: Record<string, { cities: string[], displayName: string }> = {
    guadalajara: {
        cities: ['guadalajara', 'gdl', 'zapopan', 'tlaquepaque', 'tonala', 'tlajomulco', 'jalisco', 'nayarit', 'tepic', 'colima', 'manzanillo'],
        displayName: 'Guadalajara'
    },
    coahuila: {
        cities: ['saltillo', 'torreon', 'monclova', 'piedras negras', 'coahuila', 'acuña', 'sabinas', 'durango', 'chihuahua', 'ciudad juarez', 'delicias'],
        displayName: 'Coahuila (Torreón/Saltillo)'
    },
    leon: {
        cities: ['leon', 'león', 'guanajuato', 'irapuato', 'celaya', 'salamanca', 'silao', 'aguascalientes', 'zacatecas'],
        displayName: 'León'
    },
    queretaro: {
        cities: ['queretaro', 'querétaro', 'qro', 'san juan del rio', 'corregidora', 'el marques', 'juriquilla'],
        displayName: 'Querétaro'
    },
    toluca: {
        cities: ['toluca', 'metepec', 'zinacantepec', 'estado de mexico', 'edomex', 'lerma', 'michoacan', 'morelia', 'uruapan'],
        displayName: 'Toluca'
    },
    monterrey: {
        cities: ['monterrey', 'mty', 'san pedro', 'apodaca', 'guadalupe', 'san nicolas', 'santa catarina', 'nuevo leon', 'tamaulipas', 'reynosa', 'matamoros', 'nuevo laredo', 'tampico', 'ciudad victoria'],
        displayName: 'Monterrey'
    },
    centro: {
        cities: ['cdmx', 'ciudad de mexico', 'df', 'mexico df', 'cdmx centro', 'centro historico', 'cuauhtemoc', 'venustiano carranza', 'benito juarez', 'iztacalco', 'gustavo a madero'],
        displayName: 'CDMX Centro'
    },
    armas: {
        // Armas cubre zonas industriales y periferia norte/sur de CDMX + Estados vecinos
        cities: ['azcapotzalco', 'miguel hidalgo', 'tlalpan', 'coyoacan', 'alvaro obregon', 'magdalena contreras', 'cuajimalpa', 'naucalpan', 'tlalnepantla', 'atizapan', 'ecatepec', 'nezahualcoyotl', 'morelos', 'cuernavaca', 'hidalgo', 'pachuca', 'tlaxcala', 'guerrero', 'acapulco', 'chilpancingo'],
        displayName: 'CDMX Armas'
    },
    veracruz: {
        cities: ['veracruz', 'xalapa', 'boca del rio', 'coatzacoalcos', 'poza rica', 'cordoba', 'orizaba', 'oaxaca', 'tabasco', 'villahermosa', 'chiapas', 'tuxtla', 'yucatan', 'merida', 'cancun', 'quintana roo', 'campeche'],
        displayName: 'Veracruz'
    },
    slp: {
        cities: ['san luis potosi', 'san luis potosí', 'slp', 'soledad', 'matehuala', 'ciudad valles'],
        displayName: 'San Luis Potosí'
    },
    puebla: {
        cities: ['puebla', 'cholula', 'atlixco', 'tehuacan', 'san andres cholula'],
        displayName: 'Puebla'
    }
};

// Estados sin sucursal directa - Sugerencias de canalización inteligente
const ESTADOS_SIN_SUCURSAL: Record<string, string> = {
    // Norte
    'baja california': 'No tenemos sucursal física en Baja California, pero atendemos envíos desde nuestra bodega de Monterrey o Guadalajara. ¿Te gustaría que te canalice con alguna de estas?',
    'baja california sur': 'No tenemos sucursal en BCS, pero podemos enviarte desde Guadalajara. ¿Te canalizo con un asesor de allá?',
    'sonora': 'Para Sonora, nuestra sucursal de Monterrey o Guadalajara puede apoyarte con el envío. ¿Cuál prefieres?',
    'sinaloa': 'Todavía no estamos en Sinaloa, pero desde Guadalajara o Torreón cubrimos tu zona. ¿Te paso con un agente de esas sucursales?',
    // Sureste (Cubierto mayormente por Veracruz, pero damos opción)
    'yucatan': 'En Yucatán te atendemos con envíos directos desde nuestra matriz en Veracruz. ¿Te conecto con un experto de Veracruz?',
    'quintana roo': 'Para Quintana Roo, coordinamos todo desde Veracruz con envíos rápidos. ¿Te paso con un asesor de Veracruz?',
    'campeche': 'Campeche lo cubrimos perfectamente desde nuestra sede en Veracruz. ¿Te comunico con ellos?',
    'chiapas': 'Chiapas es territorio de nuestra sucursal Veracruz. ¿Te conecto con un agente de allá?',
    'oaxaca': 'Para Oaxaca, nuestras sucursales de Puebla o Veracruz son las más cercanas. ¿Cuál te queda mejor para coordinar?',
    'tabasco': 'Tabasco lo atendemos directamente desde Veracruz o Coatzacoalcos. ¿Te paso con el equipo de Veracruz?',
    // Otros
    'nayarit': 'Desde Guadalajara cubrimos todo Nayarit. ¿Te conecto con un asesor de GDL?',
    'colima': 'Colima lo atendemos rápido desde Guadalajara. ¿Transferimos tu chat a GDL?',
    'durango': 'Durango lo cubrimos desde nuestra sucursal de Torreón (Coahuila). ¿Te comunico con ellos?',
    'chihuahua': 'Chihuahua lo gestionamos desde nuestra sucursal de Coahuila o Monterrey. ¿Con cuál prefieres hablar?',
    'guerrero': 'Guerrero lo atendemos desde CDMX o Morelos. ¿Te paso con un asesor de la Zona Centro?',
    'morelos': 'Morelos lo cubre nuestra sucursal de CDMX Armas. ¿Te conecto con ellos?',
    'zacatecas': 'Zacatecas lo atendemos desde León o San Luis Potosí. ¿Cuál prefieres?',
    'aguascalientes': 'Aguascalientes está cubierto por nuestra sucursal de León. ¿Te comunico con un asesor de León?'
};

/** Obtener lista plana de todas las ciudades configuradas para detección */
export function getAllCities(): string[] {
    const cities: string[] = [];
    Object.values(BRANCHES_CONFIG).forEach(branch => {
        cities.push(...branch.cities);
    });
    // Ordenar por longitud descendente para que "san luis potosi" se detecte antes que "san luis"
    return cities.sort((a, b) => b.length - a.length);
}

/** Obtener lista de sucursales disponibles formateada */
export function getBranchesListText(): string {
    const branches = [
        '📍 Guadalajara (Jalisco)',
        '📍 Monterrey (Nuevo León)',
        '📍 León (Guanajuato)',
        '📍 Querétaro',
        '📍 San Luis Potosí',
        '📍 Toluca (Estado de México)',
        '📍 Puebla',
        '📍 Veracruz',
        '📍 Coahuila (Torreón/Saltillo)',
        '📍 CDMX Centro',
        '📍 CDMX Armas',
    ];
    return branches.join('\n');
}

/** Detecta si es un estado sin sucursal propia */
export function detectEstadoSinSucursal(text: string): string | null {
    const normalized = normalizeText(text);
    for (const [estado, mensaje] of Object.entries(ESTADOS_SIN_SUCURSAL)) {
        if (normalized.includes(normalizeText(estado))) {
            return mensaje;
        }
    }
    return null;
}

/** Normaliza texto removiendo acentos para mejor matching */
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .trim();
}

/** Detecta la sucursal basándose en una ciudad mencionada */
export function detectBranchByCity(cityText: string): string | null {
    const normalized = normalizeText(cityText);

    for (const [branchId, config] of Object.entries(BRANCHES_CONFIG)) {
        for (const city of config.cities) {
            const normalizedCity = normalizeText(city);
            if (normalized.includes(normalizedCity) || normalizedCity.includes(normalized)) {
                return branchId;
            }
        }
    }

    return null;
}

/** Create a hand‑off alert and assign the conversation to a human/branch */
export async function handOffToHuman(conversationId: string, reason: string, detectedCity?: string) {
    const convRef = db.doc(`conversations/${conversationId}`);

    // Detectar sucursal por ciudad si se proporciona
    const branch = detectedCity ? detectBranchByCity(detectedCity) : null;

    await convRef.update({
        assignedTo: branch || 'human',  // Sucursal específica o "human" genérico
        needsHuman: true,
        branch: branch || 'general',    // Para filtrar en el dashboard
    });

    await db.collection('alerts').add({
        convId: conversationId,
        type: 'handOff',
        message: reason,
        branch: branch || 'general',
        createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`[handOffToHuman] Conversation ${conversationId} assigned to branch: ${branch || 'general'}`);
}

/** Helper to create / update a product (used by admin UI) */
export async function upsertProduct(product: any) {
    const prodRef = db.doc(`products/${product.sku}`);
    await prodRef.set(product, { merge: true });
}

/** Helper to delete a product */
export async function deleteProduct(sku: string) {
    await db.doc(`products/${sku}`).delete();
}

/** Helper to update an agent's prompt (admin UI) */
export async function updateAgentPrompt(agentId: string, newPrompt: string) {
    const agentRef = db.doc(`agents/${agentId}`);
    await agentRef.update({ prompt: newPrompt });
}
