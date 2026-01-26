import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

// GET /api/agents/[agentId] - Get single agent
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const doc = await adminDb.collection('agents').doc(agentId).get();

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
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
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

        await adminDb.collection('agents').doc(agentId).update(updateData);

        // If email changed and it's a human agent, update Firebase Auth
        if (email && type === 'human') {
            try {
                await getAuth().updateUser(agentId, { email });
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

// PATCH /api/agents/[agentId] - Cambiar contraseña del agente
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const { newPassword } = await request.json();

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
        }

        // Actualizar contraseña en Firebase Auth
        await getAuth().updateUser(agentId, { password: newPassword });

        // Actualizar contraseña en Firestore (para que admin/supervisor pueda verla)
        await adminDb.collection('agents').doc(agentId).update({
            password: newPassword,
            passwordUpdatedAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (error: any) {
        console.error('Change password error:', error);
        return NextResponse.json({ error: error.message || 'Error al cambiar contraseña' }, { status: 500 });
    }
}

// DELETE /api/agents/[agentId] - Delete agent
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const doc = await adminDb.collection('agents').doc(agentId).get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const agentData = doc.data();

        // Delete from Firestore
        await adminDb.collection('agents').doc(agentId).delete();

        // If it's a human agent, delete from Firebase Auth
        if (agentData?.type === 'human') {
            try {
                await getAuth().deleteUser(agentId);
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
