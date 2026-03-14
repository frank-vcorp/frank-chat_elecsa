
// scripts/test-sofia.ts
import { getSofiaResponse } from '../apps/web/src/lib/aiProvider';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const conversationId = 'test-conv-' + Date.now();
const phoneNumber = '521234567890';

console.log('\n--- 🤖 SIMULADOR DE SOFÍA (WhatsApp) ---');
console.log('Escribe tu mensaje para empezar a chatear. Escribe "salir" para terminar.\n');

async function chat() {
    rl.question('👤 Tú: ', async (message) => {
        if (message.toLowerCase() === 'salir') {
            rl.close();
            return;
        }

        console.log('\n⏳ Sofía está pensando...');
        try {
            const response = await getSofiaResponse(message, conversationId, phoneNumber);
            console.log('\n🤖 Sofía: ' + response + '\n');
        } catch (error) {
            console.error('\n❌ Error:', error);
        }
        chat();
    });
}

chat();
