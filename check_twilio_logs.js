import { adminDb } from './apps/web/src/lib/firebase-admin';

async function checkTwilioLogs() {
    console.log('=== Checking Twilio Webhook Logs ===\n');

    // Check for recent webhook requests
    const webhookLogs = await adminDb.collection('system_logs')
        .where('type', '==', 'webhook_request')
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();

    console.log(`Found ${webhookLogs.size} webhook requests:\n`);
    webhookLogs.forEach(doc => {
        const data = doc.data();
        console.log(`[${doc.id}]`);
        console.log(`  From: ${data.from}`);
        console.log(`  Body: ${data.body}`);
        console.log(`  Time: ${data.timestamp?.toDate?.() || 'N/A'}\n`);
    });

    // Check for AI errors
    const aiErrors = await adminDb.collection('system_logs')
        .where('type', '==', 'webhook_ai_error')
        .orderBy('timestamp', 'desc')
        .limit(3)
        .get();

    if (!aiErrors.empty) {
        console.log('\n=== AI Errors Found ===\n');
        aiErrors.forEach(doc => {
            const data = doc.data();
            console.log(`[${doc.id}]`);
            console.log(`  Error: ${data.error}`);
            console.log(`  Time: ${data.timestamp?.toDate?.() || 'N/A'}\n`);
        });
    }

    // Check recent messages
    const messages = await adminDb.collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

    console.log('\n=== Recent Messages ===\n');
    messages.forEach(doc => {
        const data = doc.data();
        console.log(`[${data.senderType}] ${data.content?.substring(0, 50)}...`);
    });
}

checkTwilioLogs().catch(e => {
    console.error('Script error:', e.message);
    process.exit(1);
});
