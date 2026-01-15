import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * DELETE /api/conversation/[conversationId]
 * Elimina una conversación y todos sus mensajes asociados.
 * Solo para administradores.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const { conversationId } = await params;
        
        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
        }

        // 1. Eliminar todos los mensajes de la conversación
        const messagesSnap = await adminDb
            .collection('messages')
            .where('conversationId', '==', conversationId)
            .get();
        
        const deletePromises = messagesSnap.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);

        // 2. Eliminar notas de la conversación (subcolección)
        const notesSnap = await adminDb
            .collection('conversations')
            .doc(conversationId)
            .collection('notes')
            .get();
        
        const deleteNotesPromises = notesSnap.docs.map(doc => doc.ref.delete());
        await Promise.all(deleteNotesPromises);

        // 3. Eliminar alertas relacionadas
        const alertsSnap = await adminDb
            .collection('alerts')
            .where('convId', '==', conversationId)
            .get();
        
        const deleteAlertsPromises = alertsSnap.docs.map(doc => doc.ref.delete());
        await Promise.all(deleteAlertsPromises);

        // 4. Eliminar la conversación
        await adminDb.collection('conversations').doc(conversationId).delete();

        console.log(`[DELETE] Conversation ${conversationId} deleted with ${messagesSnap.size} messages`);

        return NextResponse.json({ 
            success: true, 
            deletedMessages: messagesSnap.size,
            deletedNotes: notesSnap.size,
            deletedAlerts: alertsSnap.size,
        });
    } catch (error: any) {
        console.error('Error deleting conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
