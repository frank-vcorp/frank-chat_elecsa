// Script para verificar agentes en Firestore
const admin = require('firebase-admin');
const path = require('path');

// Inicializar con las credenciales del proyecto
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    path.join(__dirname, '..', 'serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath))
    });
}

const db = admin.firestore();

async function checkAgents() {
    console.log('\n🔍 VERIFICANDO AGENTES EN FIRESTORE...\n');
    
    const snapshot = await db.collection('agents').get();
    
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('═'.repeat(50));
        console.log(`ID: ${doc.id}`);
        console.log(`Nombre: ${data.name}`);
        console.log(`Email: ${data.email || 'N/A'}`);
        console.log(`Type: ${data.type || 'N/A'}`);
        console.log(`Role: ${data.role || '❌ NO DEFINIDO'}`);
        console.log(`Branch: ${data.branch || '❌ NO DEFINIDO'}`);
        console.log(`Branches: ${JSON.stringify(data.branches) || '❌ NO DEFINIDO'}`);
        console.log(`Active: ${data.active}`);
        console.log(`WhatsApp: ${data.whatsapp || 'N/A'}`);
        console.log(`CreatedAt: ${data.createdAt || 'N/A'}`);
    });
    
    console.log('\n═'.repeat(50));
    console.log(`Total: ${snapshot.docs.length} agentes`);
}

checkAgents()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
