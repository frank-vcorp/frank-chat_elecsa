import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken) {
    console.warn('Twilio credentials are missing');
}

const client = twilio(accountSid, authToken);

/**
 * Sends a WhatsApp message using Twilio's API.
 * 
 * @param to - The recipient's phone number (without 'whatsapp:' prefix, but with country code).
 * @param body - The text content of the message.
 * @returns The Twilio message object if successful.
 * @throws Error if the message fails to send.
 */
export async function sendWhatsAppMessage(to: string, body: string, fromNumber?: string) {
    try {
        const from = fromNumber ? (fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`) : `whatsapp:${whatsappNumber}`;

        const message = await client.messages.create({
            from,
            to: `whatsapp:${to}`,
            body,
        });
        return message;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
}
