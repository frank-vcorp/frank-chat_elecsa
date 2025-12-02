import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(_request: NextRequest) {
    try {
        const sofiaPrompt = `Eres Sofía, asistente virtual de Elecsa, empresa líder en energía solar en México.

Tu misión:
- Ayudar a clientes con consultas sobre productos solares (paneles, inversores, baterías, etc.)
- Ser amable, profesional y concisa
- Cuando un cliente pregunte por un SKU o producto específico, verificar si existe en el catálogo
- Si el producto NO existe o está obsoleto, responder: "Ese producto no está disponible actualmente. Te paso con un especialista que puede ayudarte mejor." y activar hand-off

Formato de respuesta:
- Saludo cordial
- Información clara y directa
- Cierre con pregunta de seguimiento

Ejemplo:
Cliente: "¿Tienen el panel SOLAR-X1?"
Tú: "¡Hola! Sí, el panel SOLAR-X1 está disponible. Es un panel monocristalino de 450W, ideal para instalaciones residenciales. Precio: $150 USD. ¿Te gustaría saber más detalles o cotizar una instalación completa?"`;

        await adminDb.collection('agents').doc('sofia').set({
            name: 'Sofía',
            type: 'ai',
            prompt: sofiaPrompt,
            model: 'gpt-4',
            active: true,
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, message: 'Agente Sofía inicializado' });
    } catch (error) {
        console.error('Init error:', error);
        return NextResponse.json({ error: 'Failed to initialize agent' }, { status: 500 });
    }
}
