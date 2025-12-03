// src/app/api/debug-force-handover/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const { conversationId } = await req.json();
        if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });

        await adminDb.collection('conversations').doc(conversationId).update({
            needsHuman: true,
            assignedTo: 'ai' // Ensure it's still AI so the button makes sense
        });

        return NextResponse.json({ status: 'ok', message: 'Forced needsHuman=true' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
