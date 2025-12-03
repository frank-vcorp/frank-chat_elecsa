// src/app/api/conversation/reopen/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const { conversationId } = await req.json();
        if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });

        await adminDb.collection('conversations').doc(conversationId).update({
            status: 'open',
            reopenedAt: new Date(),
        });

        return NextResponse.json({ status: 'ok', message: 'Conversation reopened' });
    } catch (error: any) {
        console.error('Error reopening conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
