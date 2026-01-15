import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let client: ReturnType<typeof twilio> | null = null;

if (!accountSid || !authToken || !whatsappNumber) {
    console.warn('Twilio credentials are missing; WhatsApp messages will be stored locally only');
} else {
    client = twilio(accountSid, authToken);
}

/**
 * Sends a WhatsApp message using Twilio's API.
 * 
 * @param to - The recipient's phone number (without 'whatsapp:' prefix, but with country code).
 * @param body - The text content of the message.
 * @param fromNumber - Optional custom sender number.
 * @param mediaUrl - Optional URL of media to attach (must be publicly accessible).
 * @returns The Twilio message object if successful.
 * @throws Error if the message fails to send.
 */
export async function sendWhatsAppMessage(
    to: string, 
    body: string, 
    fromNumber?: string,
    mediaUrl?: string
) {
    try {
        if (!client) {
            console.log('[Twilio] Credentials missing; skipping outbound send. Message stored only.', { to, mediaUrl });
            return {
                sid: 'mock-sid',
                status: 'queued',
                to,
                body,
            };
        }

        const from = fromNumber ? (fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`) : `whatsapp:${whatsappNumber}`;

        const messageOptions: {
            from: string;
            to: string;
            body: string;
            mediaUrl?: string[];
        } = {
            from,
            to: `whatsapp:${to}`,
            body,
        };
        
        // Agregar mediaUrl si existe
        if (mediaUrl) {
            messageOptions.mediaUrl = [mediaUrl];
        }

        const message = await client.messages.create(messageOptions);
        return message;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
}
