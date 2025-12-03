// src/app/api/admin/clearAll/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Admin endpoint to delete all conversations and their messages.
 * WARNING: This removes ALL data in the `conversations` and `messages` collections.
 * Use only in development or when you need to reset the system.
 */
export async function POST() {
    try {
        // Delete all messages
        const messagesSnap = await adminDb.collection('messages').get();
        const deleteMessagePromises = messagesSnap.docs.map((doc) => doc.ref.delete());
        await Promise.all(deleteMessagePromises);

        // Delete all conversations
        const convSnap = await adminDb.collection('conversations').get();
        const deleteConvPromises = convSnap.docs.map((doc) => doc.ref.delete());
        await Promise.all(deleteConvPromises);

        // Optionally clear alerts and logs (not mandatory)
        // await adminDb.collection('alerts').get().then(s => Promise.all(s.docs.map(d => d.ref.delete())));
        // await adminDb.collection('system_logs').get().then(s => Promise.all(s.docs.map(d => d.ref.delete())));

        return NextResponse.json({ status: 'ok', deletedMessages: messagesSnap.size, deletedConversations: convSnap.size });
    } catch (error: any) {
        console.error('Error clearing data:', error);
        return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
    }
}
