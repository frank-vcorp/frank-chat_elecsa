require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function checkAndUpdateAdmin() {
  // Buscar agente por email
  const snapshot = await db.collection('agents').where('email', '==', 'frank@vcorp.mx').get();
  
  if (snapshot.empty) {
    console.log('No se encontró agente con email frank@vcorp.mx');
    console.log('\nListando todos los agentes:');
    const allAgents = await db.collection('agents').get();
    allAgents.forEach(doc => {
      const data = doc.data();
      console.log(`- ${doc.id}: ${data.email || data.name} (rol: ${data.role}, tipo: ${data.type})`);
    });
  } else {
    snapshot.forEach(doc => {
      console.log('Agente encontrado:', doc.id);
      console.log('Datos actuales:', JSON.stringify(doc.data(), null, 2));
    });
  }
}

checkAndUpdateAdmin().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
