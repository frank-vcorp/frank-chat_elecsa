const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// 1. Inicializar Firebase Administrador
if (getApps().length === 0) {
    let credential = undefined;
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
        credential = cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
        console.log('[Setup] Usando credenciales de servicio (FIREBASE_PRIVATE_KEY).');
    } else {
        console.warn('⚠️ [Setup] Variables de entorno FIREBASE incompletas. Abortando.');
        process.exit(1);
    }

    initializeApp({ credential });
}

const db = getFirestore();

// 2. Ruta del Archivo Excel
const filePath = path.join(__dirname, '../../../docs/listado existencias 230226.xlsx');

async function uploadCatalog() {
    try {
        console.log(`[1] Leyendo Excel... (${filePath})`);
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = xlsx.utils.sheet_to_json(sheet);
        console.log(`ℹ️ Se encontraron ${rawData.length} registros en el Excel.`);

        if (rawData.length === 0) {
            console.log('❌ El archivo está vacío.');
            return;
        }

        console.log('[2] Iniciando carga a Firestore (por lotes de 500)...');

        let batch = db.batch();
        let operationCount = 0;
        let totalUploaded = 0;

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];

            // Extracción y Mapeo Seguro (Skipping inválidos)
            const sku = (row['Artículo'] || '').toString().trim().toUpperCase();
            if (!sku) continue; // Ignorar filas sin SKU

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

            const docRef = db.collection('products').doc(sku);
            batch.set(docRef, mappedProduct, { merge: true }); // Merge actualiza o crea sin borrar otros campos
            operationCount++;

            // Firebase Limit: Max 500 writes per batch
            if (operationCount >= 500) {
                console.log(`⏳ Committing lote... (${totalUploaded + 1} a ${totalUploaded + operationCount})`);
                await batch.commit();
                totalUploaded += operationCount;
                operationCount = 0;
                batch = db.batch(); // Reiniciar el lote

                // Pequeña pausa para no ahorcar la red/BD
                await new Promise(r => setTimeout(r, 200));
            }
        }

        // Commitear el sobrante final
        if (operationCount > 0) {
            console.log(`⏳ Committing último lote... (${operationCount} ops)`);
            await batch.commit();
            totalUploaded += operationCount;
        }

        console.log(`\n✅ ¡MIGRACIÓN EXITOSA!`);
        console.log(`🚀 Total de productos cargados/actualizados: ${totalUploaded}`);

    } catch (error) {
        console.error('❌ Error fatal durante la migración:', error);
    }
}

// Ejecutar
uploadCatalog().then(() => {
    console.log('Fin del script.');
    process.exit(0);
});
