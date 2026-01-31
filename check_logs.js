
import { adminDb } from './apps/web/src/lib/firebase-admin';

async function checkLogs() {
    console.log('Fetching latest system logs...');
    const logs = await adminDb.collection('system_logs')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

    logs.forEach(doc => {
        console.log(`--- Log ${doc.id} ---`);
        console.log(JSON.stringify(doc.data(), null, 2));
    });
}

checkLogs().catch(console.error);
