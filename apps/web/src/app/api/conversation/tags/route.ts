// src/app/api/conversation/tags/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const { conversationId, tags } = await req.json();

        if (!conversationId || !Array.isArray(tags)) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        await adminDb.collection('conversations').doc(conversationId).update({
            tags: tags,
        });

        return NextResponse.json({ status: 'ok', message: 'Tags updated', tags });
    } catch (error: any) {
        console.error('Error updating tags:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
