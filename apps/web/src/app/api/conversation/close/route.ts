// src/app/api/conversation/close/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const { conversationId } = await req.json();
        if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });

        await adminDb.collection('conversations').doc(conversationId).update({
            status: 'closed',
            closedAt: new Date(),
        });

        return NextResponse.json({ status: 'ok', message: 'Conversation closed' });
    } catch (error: any) {
        console.error('Error closing conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
