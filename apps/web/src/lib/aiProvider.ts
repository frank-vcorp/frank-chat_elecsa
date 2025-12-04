// src/lib/aiProvider.ts
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import OpenAI from 'openai';

const db = getFirestore();

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
    // Simply fetch the prompt and let the LLM handle the response
    const prompt = await getAgentPrompt('sofia');
    return callOpenAI(prompt, message);
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

/** Create a hand‑off alert and assign the conversation to a human */
export async function handOffToHuman(conversationId: string, reason: string) {
    const convRef = db.doc(`conversations/${conversationId}`);
    await convRef.update({ assignedTo: 'human', needsHuman: true });

    await db.collection('alerts').add({
        convId: conversationId,
        type: 'handOff',
        message: reason,
        createdAt: FieldValue.serverTimestamp(),
    });
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
