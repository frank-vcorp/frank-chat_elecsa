import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import * as xlsx from 'xlsx';

/**
 * Función auxiliar para verificar que el usuario sea un administrador autenticado
 * Replicando el patrón de seguridad de /api/agents/fix
 */
async function verifyAdminRole(): Promise<{ valid: boolean; error?: string; userId?: string }> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return { valid: false, error: 'No autenticado - sesión no encontrada' };
        }

        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        const userId = decodedClaims.uid;

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
        console.error('[sync-excel] Error verificando admin:', error);
        return { valid: false, error: 'Error de autenticación' };
    }
}

export async function POST(request: Request) {
    try {
        // 🔒 SEGURIDAD: Verificar rol de administrador
        const authResult = await verifyAdminRole();
        if (!authResult.valid) {
            return NextResponse.json({ error: authResult.error }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
        }

        // Robustez: Límite de 10MB para evitar OOM (Out of Memory)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'El archivo es demasiado grande (Máx 10MB)' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(sheet);

        if (rawData.length === 0) {
            return NextResponse.json({ error: 'El archivo Excel está vacío o no es válido' }, { status: 400 });
        }

        let batch = adminDb.batch();
        let operationCount = 0;
        let totalUploaded = 0;

        for (let i = 0; i < rawData.length; i++) {
            const row: any = rawData[i];

            // Extracción segura
            const sku = (row['Artículo'] || '').toString().trim().toUpperCase();
            if (!sku) continue;

            const mappedProduct = {
                sku: sku,
                description: (row['Desc. Artículo'] || '').toString().trim(),
                price: typeof row['PRECIO 2'] === 'number' ? row['PRECIO 2'] : parseFloat(row['PRECIO 2']) || 0,
                currency: (row['MONEDA'] || 'MXN').toString().trim(),
                supplier: (row['Proveedor'] || '').toString().trim(),
                stock: typeof row['Disponible'] === 'number' ? row['Disponible'] : parseInt(row['Disponible']) || 0,
                category: (row['Cedula'] || '').toString().trim(),
                family: (row['Familia'] || '').toString().trim(),
                status: 'active',
                updatedAt: new Date().toISOString()
            };

            const docRef = adminDb.collection('products').doc(sku);
            batch.set(docRef, mappedProduct, { merge: true }); // Merge no borra campos antiguos existentes
            operationCount++;

            if (operationCount >= 500) {
                await batch.commit();
                totalUploaded += operationCount;
                operationCount = 0;
                batch = adminDb.batch();
            }
        }

        // Commitear el resto
        if (operationCount > 0) {
            await batch.commit();
            totalUploaded += operationCount;
        }

        return NextResponse.json({
            success: true,
            message: `Catálogo sincronizado exitosamente. ${totalUploaded} productos subidos/actualizados.`
        });

    } catch (error: any) {
        console.error('Error procesando XLXS en API:', error);
        return NextResponse.json({ error: error.message || 'Error del lado del servidor' }, { status: 500 });
    }
}
