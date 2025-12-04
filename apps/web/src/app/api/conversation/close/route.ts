// src/app/api/conversation/close/route.ts
import { NextResponse } from 'next/server';
import { closeConversation } from '@/lib/conversation';

export async function POST(req: Request) {
    try {
        const { conversationId } = await req.json();
        if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });

        const summary = await closeConversation(conversationId);

        return NextResponse.json({ status: 'ok', message: 'Conversation closed', summary });
    } catch (error: any) {
        console.error('Error closing conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
