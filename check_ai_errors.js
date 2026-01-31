
import { adminDb } from './apps/web/src/lib/firebase-admin';

async function checkSpecificLogs() {
    console.log('Fetching latest webhook errors...');
    const logs = await adminDb.collection('system_logs')
        .where('type', '==', 'webhook_ai_error')
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();

    if (logs.empty) {
        console.log('No AI errors found. Fetching any webhook logs...');
        const anyLogs = await adminDb.collection('system_logs')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        anyLogs.forEach(doc => {
            console.log(`--- Log ${doc.id} (${doc.data().type}) ---`);
            console.log(JSON.stringify(doc.data(), null, 2));
        });
    } else {
        logs.forEach(doc => {
            console.log(`--- AI Error ${doc.id} ---`);
            console.log(JSON.stringify(doc.data(), null, 2));
        });
    }
}

checkSpecificLogs().catch(e => {
    console.error('Error running script:', e);
});
