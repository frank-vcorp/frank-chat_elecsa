const admin = require('firebase-admin');

// Usar el token de Firebase
process.env.GOOGLE_APPLICATION_CREDENTIALS = '';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'frank-chat-elecsa'
    });
}

const db = admin.firestore();

async function checkWhatsAppActivity() {
    console.log('🔍 Verificando actividad de WhatsApp...\n');

    try {
        // Verificar logs del sistema
        const logsSnap = await db.collection('system_logs')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        console.log(`📋 Últimos ${logsSnap.size} logs del sistema:\n`);
        logsSnap.forEach(doc => {
            const data = doc.data();
            const time = data.timestamp?.toDate?.() || 'N/A';
            console.log(`[${data.type}] ${time}`);
            if (data.from) console.log(`  From: ${data.from}`);
            if (data.body) console.log(`  Body: ${data.body}`);
            if (data.error) console.log(`  ❌ Error: ${data.error}`);
            console.log('');
        });

        // Verificar mensajes recientes
        console.log('\n📨 Últimos mensajes:\n');
        const messagesSnap = await db.collection('messages')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        messagesSnap.forEach(doc => {
            const data = doc.data();
            const time = data.createdAt?.toDate?.() || 'N/A';
            console.log(`[${data.senderType}] ${data.content?.substring(0, 80)}`);
            console.log(`  Conversación: ${data.conversationId}`);
            console.log(`  Hora: ${time}\n`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkWhatsAppActivity();
