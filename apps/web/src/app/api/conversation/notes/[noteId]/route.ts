
// src/app/api/conversation/notes/[noteId]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function DELETE(req: Request, { params }: { params: Promise<{ noteId: string }> }) {
    try {
        const { noteId } = await params;
        const { conversationId } = await req.json();
        if (!noteId) return NextResponse.json({ error: 'Missing noteId' }, { status: 400 });
        if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });

        await adminDb.collection('conversations')
            .doc(conversationId)
            .collection('notes')
            .doc(noteId)
            .delete();

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('Error deleting note', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
