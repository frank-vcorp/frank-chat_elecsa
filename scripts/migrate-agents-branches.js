/**
 * FIX REFERENCE: FIX-20250128-01
 * Script de migración: Normalizar campo `branches` para todos los agentes
 * 
 * Este script:
 * 1. Busca agentes que tienen `branch` pero no tienen `branches`
 * 2. Crea el array `branches` a partir del `branch` existente
 * 3. NO modifica agentes que ya tienen `branches`
 */
require('dotenv').config({ path: './apps/web/.env.local' });

const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || 
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
    'frank-chat-elecsa';

if (!admin.apps.length) {
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } else {
        admin.initializeApp({ projectId });
    }
}

const db = admin.firestore();

async function migrateAgentsBranches() {
    console.log('\n🔧 MIGRACIÓN: Normalizar campo `branches` en agentes\n');
    console.log('═'.repeat(60));
    
    const snapshot = await db.collection('agents').get();
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const doc of snapshot.docs) {
        const data = doc.data();
        const agentId = doc.id;
        
        // Si ya tiene branches, saltar
        if (data.branches && Array.isArray(data.branches) && data.branches.length > 0) {
            console.log(`⏭️  ${data.name || agentId}: Ya tiene branches (${data.branches.join(', ')})`);
            skipped++;
            continue;
        }
        
        // Determinar branches a partir de branch o default a 'general'
        const newBranches = data.branch ? [data.branch] : ['general'];
        
        try {
            await db.collection('agents').doc(agentId).update({
                branches: newBranches,
                // Si no tiene branch, también asignarlo
                ...(data.branch ? {} : { branch: 'general' })
            });
            
            console.log(`✅ ${data.name || agentId}: Migrado → branches: [${newBranches.join(', ')}]`);
            migrated++;
        } catch (err) {
            console.error(`❌ ${data.name || agentId}: Error - ${err.message}`);
            errors++;
        }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN:');
    console.log(`   ✅ Migrados: ${migrated}`);
    console.log(`   ⏭️  Saltados (ya tenían branches): ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📋 Total procesados: ${snapshot.docs.length}`);
    console.log('═'.repeat(60));
}

// Ejecutar con --dry-run para solo mostrar qué se haría
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
    console.log('\n🔍 MODO DRY-RUN: Solo mostrando qué se haría...\n');
    db.collection('agents').get().then(snapshot => {
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (!data.branches || !Array.isArray(data.branches) || data.branches.length === 0) {
                const newBranches = data.branch ? [data.branch] : ['general'];
                console.log(`[PENDIENTE] ${data.name || doc.id}: branch="${data.branch}" → branches=[${newBranches.join(', ')}]`);
            } else {
                console.log(`[OK] ${data.name || doc.id}: Ya tiene branches=[${data.branches.join(', ')}]`);
            }
        });
        process.exit(0);
    });
} else {
    migrateAgentsBranches()
        .then(() => {
            console.log('\n✅ Migración completada\n');
            process.exit(0);
        })
        .catch(err => {
            console.error('\n❌ Error en migración:', err);
            process.exit(1);
        });
}
