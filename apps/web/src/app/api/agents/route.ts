import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export async function GET(_request: NextRequest) {
    try {
        const snapshot = await adminDb.collection('agents').get();
        const agents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(agents);
    } catch (error) {
        console.error('Failed to fetch agents', error);
        return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { id, name, email, password, role, type, prompt, branch } = await request.json();

        // If creating a human agent, create in Firebase Auth first
        if (type === 'human' && email && password) {
            try {
                const userRecord = await getAuth().createUser({
                    email,
                    password,
                    displayName: name,
                });

                // Create agent document in Firestore
                await adminDb.collection('agents').doc(userRecord.uid).set({
                    name: name || email,
                    email,
                    role: role || 'agent',
                    type: 'human',
                    branch: branch || 'general', // Sucursal del agente
                    active: true,
                    createdAt: new Date().toISOString(),
                });

                return NextResponse.json({ success: true, id: userRecord.uid, branch });
            } catch (authError: any) {
                console.error('Auth error:', authError);
                return NextResponse.json({
                    error: authError.message || 'Failed to create user'
                }, { status: 400 });
            }
        }

        // If updating an existing agent (AI agent or prompt update)
        if (id) {
            const updateData: any = { updatedAt: new Date().toISOString() };
            if (prompt !== undefined) updateData.prompt = prompt;
            if (name) updateData.name = name;
            if (role) updateData.role = role;
            if (branch) updateData.branch = branch;

            await adminDb.collection('agents').doc(id).update(updateData);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error) {
        console.error('Failed to save agent', error);
        return NextResponse.json({ error: 'Failed to save agent' }, { status: 500 });
    }
}
