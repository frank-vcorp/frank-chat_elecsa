// src/lib/aiProvider.ts
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import OpenAI from 'openai';

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

/** Core function used by the Twilio webhook for the "Sofía" agent */
export async function getSofiaResponse(
    message: string,
    conversationId: string,
    phoneNumber: string
): Promise<string> {
    console.log(`[getSofiaResponse] Processing message: "${message}"`);
    
    // Cargar en paralelo para mejor performance
    const [basePrompt, contextText, productsText] = await Promise.all([
        getAgentPrompt('sofia'),
        getContextDocumentsText(),
        getProductsCatalogText(),
    ]);

    // Construir prompt final: base + catálogo de productos + documentos de contexto
    let finalPrompt = basePrompt;
    if (productsText) {
        finalPrompt += productsText;
    }
    if (contextText) {
        finalPrompt += contextText;
    }

    return callOpenAI(finalPrompt, message);
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

    return callOpenAI(finalPrompt, message);
}

/** Generic wrapper around OpenAI's chat completion */
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

// Configuración de sucursales y mapeo de ciudades
const BRANCHES_CONFIG: Record<string, { cities: string[] }> = {
    guadalajara: { cities: ['guadalajara', 'gdl', 'zapopan', 'tlaquepaque', 'tonala', 'tlajomulco', 'jalisco'] },
    coahuila: { cities: ['saltillo', 'torreon', 'monclova', 'piedras negras', 'coahuila', 'acuña', 'sabinas'] },
    leon: { cities: ['leon', 'guanajuato', 'irapuato', 'celaya', 'salamanca', 'silao'] },
    queretaro: { cities: ['queretaro', 'qro', 'san juan del rio', 'corregidora', 'el marques'] },
    toluca: { cities: ['toluca', 'metepec', 'zinacantepec', 'estado de mexico', 'edomex', 'lerma'] },
    monterrey: { cities: ['monterrey', 'mty', 'san pedro', 'apodaca', 'guadalupe', 'san nicolas', 'santa catarina', 'nuevo leon'] },
    centro: { cities: ['cdmx centro', 'centro historico', 'cuauhtemoc', 'venustiano carranza', 'benito juarez'] },
    armas: { cities: ['cdmx', 'ciudad de mexico', 'mexico df', 'df', 'azcapotzalco', 'miguel hidalgo', 'gustavo a madero'] },
    veracruz: { cities: ['veracruz', 'xalapa', 'boca del rio', 'coatzacoalcos', 'poza rica', 'cordoba', 'orizaba'] },
    slp: { cities: ['san luis potosi', 'slp', 'soledad', 'matehuala', 'ciudad valles'] },
    puebla: { cities: ['puebla', 'cholula', 'atlixco', 'tehuacan', 'san andres cholula'] }
};

/** Normaliza texto removiendo acentos para mejor matching */
function normalizeText(text: string): string {
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
