require('dotenv').config({ path: '.env.local' });

// Debug de variables
console.log('PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('CLIENT_EMAIL exists:', !!process.env.FIREBASE_CLIENT_EMAIL);
console.log('PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);

const admin = require('firebase-admin');

// Intentar con projectId directamente si no hay credentials
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'frank-chat-elecsa';

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
    // Usar Application Default Credentials
    admin.initializeApp({ projectId });
  }
}

const db = admin.firestore();

async function checkAgents() {
    console.log('\n🔍 VERIFICANDO AGENTES EN FIRESTORE...\n');
    
    const snapshot = await db.collection('agents').get();
    
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('═'.repeat(60));
        console.log(`📋 ID: ${doc.id}`);
        console.log(`   Nombre: ${data.name || 'N/A'}`);
        console.log(`   Email: ${data.email || 'N/A'}`);
        console.log(`   Type: ${data.type || 'N/A'}`);
        console.log(`   Role: ${data.role ? '✅ ' + data.role : '❌ NO DEFINIDO'}`);
        console.log(`   Branch: ${data.branch ? '✅ ' + data.branch : '❌ NO DEFINIDO'}`);
        console.log(`   Branches: ${data.branches ? '✅ ' + JSON.stringify(data.branches) : '❌ NO DEFINIDO'}`);
        console.log(`   Active: ${data.active !== undefined ? data.active : 'N/A'}`);
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log(`📊 Total: ${snapshot.docs.length} agentes`);
}

checkAgents()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
