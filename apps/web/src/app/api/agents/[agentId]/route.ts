import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

// GET /api/agents/[agentId] - Get single agent
export async function GET(
    _request: NextRequest,
    { params }: { params: { agentId: string } }
) {
    try {
        const doc = await adminDb.collection('agents').doc(params.agentId).get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Get agent error:', error);
        return NextResponse.json({ error: 'Failed to get agent' }, { status: 500 });
    }
}

// PUT /api/agents/[agentId] - Update agent
export async function PUT(
    request: NextRequest,
    { params }: { params: { agentId: string } }
) {
    try {
        const data = await request.json();
        const { name, email, role, type, prompt } = data;

        const updateData: any = {
            updatedAt: new Date().toISOString(),
        };

        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (type) updateData.type = type;
        if (prompt !== undefined) updateData.prompt = prompt;

        await adminDb.collection('agents').doc(params.agentId).update(updateData);

        // If email changed and it's a human agent, update Firebase Auth
        if (email && type === 'human') {
            try {
                await getAuth().updateUser(params.agentId, { email });
            } catch (authError) {
                console.warn('Could not update auth email:', authError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update agent error:', error);
        return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
    }
}

// DELETE /api/agents/[agentId] - Delete agent
export async function DELETE(
    _request: NextRequest,
    { params }: { params: { agentId: string } }
) {
    try {
        const doc = await adminDb.collection('agents').doc(params.agentId).get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const agentData = doc.data();

        // Delete from Firestore
        await adminDb.collection('agents').doc(params.agentId).delete();

        // If it's a human agent, delete from Firebase Auth
        if (agentData?.type === 'human') {
            try {
                await getAuth().deleteUser(params.agentId);
            } catch (authError) {
                console.warn('Could not delete auth user:', authError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete agent error:', error);
        return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
    }
}
