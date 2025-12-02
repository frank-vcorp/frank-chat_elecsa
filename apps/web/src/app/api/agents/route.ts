// src/app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/agents
 * Returns a list of all agents.
 */
export async function GET(request: NextRequest) {
    try {
        const snapshot = await adminDb.collection('agents').get();
        const agents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(agents);
    } catch (error) {
        console.error('Error fetching agents:', error);
        return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }
}

/**
 * POST /api/agents
 * Creates or updates an agent.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...rest } = body;
        if (!id) {
            return NextResponse.json({ error: 'Missing agent id' }, { status: 400 });
        }
        const agentRef = adminDb.collection('agents').doc(id);
        await agentRef.set({ id, ...rest, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return NextResponse.json({ message: 'Agent saved', id });
    } catch (error) {
        console.error('Error saving agent:', error);
        return NextResponse.json({ error: 'Failed to save agent' }, { status: 500 });
    }
}
