const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables from apps/web/.env.local
const envPath = path.join(__dirname, '../apps/web/.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/"/g, '');
        }
    });
}

// Initialize Firebase Admin
const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
};

if (!serviceAccount.privateKey) {
    console.error('Error: FIREBASE_PRIVATE_KEY not found in apps/web/.env.local');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createAgent() {
    const email = 'ana.queretaro@elecsa.com';
    const password = 'Elecsa2026!';
    const name = 'Ana Díaz (Querétaro)';
    const branch = 'queretaro';

    try {
        // 1. Create Auth User
        let uid;
        try {
            const userRecord = await auth.getUserByEmail(email);
            uid = userRecord.uid;
            console.log(`User ${email} already exists. Updating password...`);
            await auth.updateUser(uid, { password });
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log(`Creating user ${email}...`);
                const userRecord = await auth.createUser({
                    email,
                    password,
                    displayName: name,
                    emailVerified: true,
                });
                uid = userRecord.uid;
            } else {
                throw error;
            }
        }

        // 2. Create Agent Document in Firestore
        console.log(`Updating agent document for ${name}...`);
        await db.collection('agents').doc(uid).set({
            id: uid,
            name,
            email,
            role: 'agent',
            type: 'human',
            branch,
            branches: [branch],
            active: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log('\n✅ Agent created successfully!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Branch: ${branch}`);
        console.log('-----------------------------------');
        console.log('You can now login with these credentials.');

    } catch (error) {
        console.error('Error creating agent:', error);
    }
}

createAgent();
