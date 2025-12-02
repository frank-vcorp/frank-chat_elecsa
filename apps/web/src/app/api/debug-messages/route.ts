import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Returns the most recent 20 messages from the `messages` collection.
 * Useful for debugging whether Sofía's reply was stored.
 */
export async function GET(request: NextRequest) {
    try {
        const msgsSnap = await adminDb
            .collection('messages')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        const msgs = msgsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ messages: msgs }, { status: 200 });
    } catch (e) {
        console.error('Debug messages error', e);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
