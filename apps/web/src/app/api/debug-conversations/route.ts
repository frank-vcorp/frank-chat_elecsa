// src/app/api/debug-conversations/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const snap = await adminDb.collection('conversations').get();
        const convs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ count: convs.length, conversations: convs });
    } catch (error: any) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
