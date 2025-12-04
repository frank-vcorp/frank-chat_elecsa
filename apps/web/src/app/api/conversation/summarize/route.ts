// src/app/api/conversation/summarize/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import OpenAI from 'openai';

export async function POST(req: Request) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const { conversationId } = await req.json();
        if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });

        // 1. Fetch messages
        const msgsSnap = await adminDb.collection('messages')
            .where('conversationId', '==', conversationId)
            .orderBy('createdAt', 'asc')
            .limitToLast(50)
            .get();

        if (msgsSnap.empty) {
            return NextResponse.json({ message: 'No messages to summarize' });
        }

        const transcript = msgsSnap.docs.map(doc => {
            const data = doc.data();
            return `${data.senderType === 'agent' || data.senderType === 'system' ? 'Agente' : 'Cliente'}: ${data.content}`;
        }).join('\n');

        // 2. Generate summary with OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Eres un asistente administrativo experto. Tu tarea es resumir la siguiente conversación de atención al cliente en un formato conciso y estructurado.
          
          Genera un resumen en texto plano con estos 3 puntos:
          1. **Intención del Cliente**: ¿Qué buscaba? (Producto, soporte, queja, etc.)
          2. **Resultado**: ¿Se resolvió? ¿Se vendió? ¿Se agendó?
          3. **Acción Pendiente**: ¿Queda algo por hacer? (Enviar cotización, llamar, nada).
          
          Sé breve y directo.`
                },
                {
                    role: 'user',
                    content: transcript
                }
            ],
        });

        const summary = completion.choices[0].message?.content || 'No se pudo generar el resumen.';

        // 3. Save summary to conversation
        await adminDb.collection('conversations').doc(conversationId).update({
            summary: summary,
            summarizedAt: new Date(),
        });

        return NextResponse.json({ status: 'ok', summary });
    } catch (error: any) {
        console.error('Error summarizing conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
