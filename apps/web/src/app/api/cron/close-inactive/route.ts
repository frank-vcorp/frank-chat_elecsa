import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { closeConversation } from '@/lib/conversation';

export async function GET(req: Request) {
    try {
        // 30 minutes ago
        const cutoff = new Date(Date.now() - 30 * 60 * 1000);

        const snapshot = await adminDb.collection('conversations')
            .where('status', '==', 'open')
            .where('assignedTo', '==', 'human')
            .where('lastMessageAt', '<', cutoff)
            .get();

        const results = [];
        for (const doc of snapshot.docs) {
            const summary = await closeConversation(doc.id);
            results.push({ id: doc.id, summary });
        }

        return NextResponse.json({
            status: 'ok',
            closedCount: results.length,
            results
        });
    } catch (error: any) {
        console.error('Error in cron job:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
