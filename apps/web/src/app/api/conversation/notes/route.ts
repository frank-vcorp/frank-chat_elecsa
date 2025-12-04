// src/app/api/conversation/notes/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
    try {
        const { conversationId, content, authorId } = await req.json();

        if (!conversationId || !content || !authorId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const noteRef = await adminDb
            .collection('conversations')
            .doc(conversationId)
            .collection('notes')
            .add({
                content,
                authorId,
                createdAt: FieldValue.serverTimestamp(),
            });

        return NextResponse.json({ status: 'ok', noteId: noteRef.id });
    } catch (error: any) {
        console.error('Error adding note:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
