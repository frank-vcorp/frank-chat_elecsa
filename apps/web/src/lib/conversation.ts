import { adminDb } from '@/lib/firebase-admin';
import { generateConversationSummary } from '@/lib/aiProvider';

export async function closeConversation(conversationId: string) {
    // 1. Fetch conversation messages for summary
    const messagesSnap = await adminDb.collection('messages')
        .where('conversationId', '==', conversationId)
        .orderBy('createdAt', 'asc')
        .get();

    const messages = messagesSnap.docs.map(doc => {
        const data = doc.data();
        return {
            role: data.sender === 'user' ? 'user' : 'assistant',
            content: data.body || ''
        };
    });

    // 2. Generate Summary
    let summary = '';
    if (messages.length > 0) {
        try {
            summary = await generateConversationSummary(messages);
        } catch (aiError) {
            console.error('Error generating summary:', aiError);
            summary = 'Error generando resumen automático.';
        }
    }

    // 3. Close conversation and save summary
    await adminDb.collection('conversations').doc(conversationId).update({
        status: 'closed',
        closedAt: new Date(),
        summary: summary,
        summarizedAt: new Date()
    });

    return summary;
}
