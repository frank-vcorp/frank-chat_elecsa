import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

/**
 * Endpoint para corregir agentes que no tienen branches configurado correctamente
 * GET: Lista agentes con problemas de configuración
 * POST: Corrige automáticamente los agentes (copia branch a branches si falta)
 * 
 * ⚠️ SEGURIDAD: Requiere autenticación de administrador
 * 
 * FIX REFERENCE: FIX-20250128-02
 * @author IMPL-20250128-02
 */

// Función auxiliar para verificar rol admin
async function verifyAdminRole(): Promise<{ valid: boolean; error?: string; userId?: string }> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;
        
        if (!sessionCookie) {
            return { valid: false, error: 'No autenticado - sesión no encontrada' };
        }

        // Verificar el token de sesión
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        const userId = decodedClaims.uid;

        // Buscar el agente en Firestore y verificar rol
        const agentDoc = await adminDb.collection('agents').doc(userId).get();
        
        if (!agentDoc.exists) {
            return { valid: false, error: 'Usuario no registrado como agente' };
        }

        const agentData = agentDoc.data();
        if (agentData?.role !== 'admin') {
            return { valid: false, error: 'Acceso denegado - se requiere rol de administrador' };
        }

        return { valid: true, userId };
    } catch (error: any) {
        console.error('[/api/agents/fix] Error verificando admin:', error);
        return { valid: false, error: 'Error de autenticación: ' + error.message };
    }
}

export async function GET() {
    // 🔒 Verificar autenticación de admin
    const authResult = await verifyAdminRole();
    if (!authResult.valid) {
        return NextResponse.json(
            { error: authResult.error },
            { status: 401 }
        );
    }
    console.log(`[/api/agents/fix] GET ejecutado por admin: ${authResult.userId}`);
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
    // 🔒 Verificar autenticación de admin
    const authResult = await verifyAdminRole();
    if (!authResult.valid) {
        return NextResponse.json(
            { error: authResult.error },
            { status: 401 }
        );
    }
    console.log(`[/api/agents/fix] POST ejecutado por admin: ${authResult.userId}`);

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
