import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Endpoint para corregir agentes que no tienen branches configurado correctamente
 * GET: Lista agentes con problemas de configuración
 * POST: Corrige automáticamente los agentes (copia branch a branches si falta)
 * 
 * FIX REFERENCE: FIX-20250128-02
 * @author IMPL-20250128-02
 */
export async function GET() {
    try {
        const snapshot = await adminDb.collection('agents').get();
        const agentsWithIssues: any[] = [];
        const agentsOk: any[] = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const issues: string[] = [];

            // Verificar campos críticos
            if (!data.role) issues.push('Sin rol asignado');
            if (!data.branch && !data.branches) issues.push('Sin sucursal asignada');
            if (data.branch && !data.branches) issues.push('Tiene branch pero no branches (array)');
            if (data.type === 'human' && !data.email) issues.push('Agente humano sin email');

            const agentInfo = {
                id: doc.id,
                name: data.name || '(sin nombre)',
                email: data.email || '(sin email)',
                role: data.role || '(sin rol)',
                branch: data.branch || '(sin branch)',
                branches: data.branches || '(sin branches)',
                type: data.type || '(sin tipo)',
                issues,
            };

            if (issues.length > 0) {
                agentsWithIssues.push(agentInfo);
            } else {
                agentsOk.push(agentInfo);
            }
        });

        return NextResponse.json({
            total: snapshot.size,
            withIssues: agentsWithIssues.length,
            ok: agentsOk.length,
            agentsWithIssues,
            agentsOk,
        });
    } catch (error: any) {
        console.error('Error checking agents:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        const snapshot = await adminDb.collection('agents').get();
        const fixes: any[] = [];
        const batch = adminDb.batch();

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const updateData: any = {};
            let needsUpdate = false;

            // Fix 1: Si tiene branch pero no branches, crear el array
            if (data.branch && !data.branches) {
                updateData.branches = [data.branch];
                needsUpdate = true;
            }

            // Fix 2: Si no tiene branch ni branches, asignar 'general'
            if (!data.branch && !data.branches) {
                updateData.branch = 'general';
                updateData.branches = ['general'];
                needsUpdate = true;
            }

            // Fix 3: Si no tiene rol y es humano, asignar 'agent'
            if (!data.role && data.type === 'human') {
                updateData.role = 'agent';
                needsUpdate = true;
            }

            // Fix 4: Si no tiene rol y es IA, asignar 'ai'
            if (!data.role && data.type === 'ai') {
                updateData.role = 'ai';
                needsUpdate = true;
            }

            if (needsUpdate) {
                batch.update(doc.ref, updateData);
                fixes.push({
                    id: doc.id,
                    name: data.name,
                    email: data.email,
                    appliedFixes: updateData,
                });
            }
        });

        if (fixes.length > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            message: fixes.length > 0 ? 'Agentes corregidos' : 'No se encontraron agentes para corregir',
            fixedCount: fixes.length,
            fixes,
        });
    } catch (error: any) {
        console.error('Error fixing agents:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
