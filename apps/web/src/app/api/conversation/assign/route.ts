// src/app/api/conversation/assign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/conversation/assign
 * Assigns a conversation to a specific agent (human or AI).
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { conversationId, agentId, agentName } = body;

        if (!conversationId || !agentId) {
            return NextResponse.json({ error: 'Missing conversationId or agentId' }, { status: 400 });
        }

        const convRef = adminDb.collection('conversations').doc(conversationId);

        // If assigning to a human, we also clear the needsHuman flag
        const updateData: any = {
            assignedTo: agentId,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (agentId !== 'ai') {
            updateData.needsHuman = false;
            // Guardar nombre del agente para mostrar en UI
            if (agentName) {
                updateData.assignedToName = agentName;
            }
        } else {
            // Si vuelve a IA, limpiar el nombre del agente
            updateData.assignedToName = null;
        }

        await convRef.update(updateData);

        return NextResponse.json({ message: 'Conversation assigned', conversationId, assignedTo: agentId, assignedToName: agentName });
    } catch (error) {
        console.error('Error assigning conversation:', error);
        return NextResponse.json({ error: 'Failed to assign conversation' }, { status: 500 });
    }
}
