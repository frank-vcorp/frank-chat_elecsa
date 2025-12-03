// src/app/api/conversation/assign/ai/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/** Assign the conversation back to the AI agent */
export async function POST(req: Request) {
    try {
        const { conversationId } = await req.json();
        if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });

        await adminDb.collection('conversations').doc(conversationId).update({
            assignedTo: 'ai',
            status: 'open', // ensure open
            needsHuman: false,
        });

        return NextResponse.json({ status: 'ok', message: 'Conversation reassigned to AI' });
    } catch (error: any) {
        console.error('Error reassigning to AI:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
