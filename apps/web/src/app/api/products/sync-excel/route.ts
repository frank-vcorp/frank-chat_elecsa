import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import * as xlsx from 'xlsx';

/**
 * Función auxiliar para verificar que el usuario sea un administrador autenticado
 * Replicando el patrón de seguridad de /api/agents/fix
 */
async function verifyAdminRole(request: Request): Promise<{ valid: boolean; error?: string; userId?: string }> {
    try {
        // 1. Intentar obtener token del header Authorization (Prioridad para Firebase Client Auth)
        const authHeader = request.headers.get('Authorization');
        let token = '';

        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else {
            // 2. Fallback: intentar obtener cookie de sesión
            const cookieStore = await cookies();
            token = cookieStore.get('session')?.value || '';
        }

        if (!token) {
            return { valid: false, error: 'No autenticado - token no encontrado' };
        }

        // 3. Verificar el token (puede ser Session Cookie o ID Token)
        let decodedClaims;
        try {
            // Intentar como ID Token (más común en este proyecto)
            decodedClaims = await adminAuth.verifyIdToken(token);
        } catch (e) {
            // Intentar como Session Cookie (patrón legacy/fix)
            decodedClaims = await adminAuth.verifySessionCookie(token, true);
        }

        const userId = decodedClaims.uid;
        const email = decodedClaims.email;

        // 4. Verificar rol en Firestore
        let agentDoc = await adminDb.collection('agents').doc(userId).get();
        let agentData = agentDoc.data();

        // Fallback: Si no existe por UID, buscar por email (común en migraciones legacy)
        if (!agentDoc.exists && email) {
            const agentQuery = await adminDb.collection('agents').where('email', '==', email).limit(1).get();
            if (!agentQuery.empty) {
                agentDoc = agentQuery.docs[0];
                agentData = agentDoc.data();
            }
        }

        if (!agentDoc.exists) {
            console.error(`[sync-excel] Acceso denegado: Usuario ${email} (${userId}) no encontrado en la colección 'agents'`);
            return { valid: false, error: 'Usuario no registrado como agente' };
        }

        // Aceptamos 'admin' para coincidir con la lógica interna
        if (agentData?.role !== 'admin' && agentData?.role !== 'Administrador') {
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
        const authResult = await verifyAdminRole(request);
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
            const originalSku = (row['Artículo'] || '').toString().trim();
            if (!originalSku) continue;

            // Sanitización: Firestore no permite '/' en el path del documento ID
            // porque lo interpreta como una subcolección (provocando error de path impar).
            const skuForPath = originalSku.replace(/\//g, '-').toUpperCase();

            const mappedProduct = {
                sku: originalSku.toUpperCase(), // Mantenemos el SKU original para la IA
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

            const docRef = adminDb.collection('products').doc(skuForPath);
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
