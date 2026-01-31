const admin = require('firebase-admin');

// Inicializar con las credenciales del proyecto
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'frank-chat-elecsa'
    });
}

const db = admin.firestore();

async function checkRecentActivity() {
    console.log('🔍 Verificando actividad reciente en Firestore...\n');

    try {
        // Verificar mensajes recientes
        const messagesSnap = await db.collection('messages')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        console.log(`📨 Últimos ${messagesSnap.size} mensajes:`);
        messagesSnap.forEach(doc => {
            const data = doc.data();
            const time = data.createdAt?.toDate?.() || 'N/A';
            console.log(`  [${data.senderType}] ${data.content?.substring(0, 60)}... (${time})`);
        });

        console.log('\n📞 Verificando conversaciones...');
        const convsSnap = await db.collection('conversations')
            .orderBy('lastMessageAt', 'desc')
            .limit(3)
            .get();

        console.log(`Encontradas ${convsSnap.size} conversaciones recientes:`);
        convsSnap.forEach(doc => {
            const data = doc.data();
            console.log(`  ID: ${doc.id}`);
            console.log(`  Contacto: ${data.contactName || 'N/A'}`);
            console.log(`  Último mensaje: ${data.lastMessage?.substring(0, 50)}...`);
            console.log(`  Asignado a: ${data.assignedTo || 'AI'}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('index')) {
            console.log('\n⚠️  PROBLEMA DETECTADO: Falta crear un índice en Firestore');
            console.log('   Ve a Firebase Console → Firestore → Indexes y créalo');
        }
    }
}

checkRecentActivity();
