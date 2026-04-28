import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let client: ReturnType<typeof twilio> | null = null;

if (!accountSid || !authToken || !whatsappNumber) {
  console.warn(
    "Twilio credentials are missing; WhatsApp messages will be stored locally only",
  );
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
  mediaUrl?: string,
) {
  try {
    if (!client) {
      console.log(
        "[Twilio] Credentials missing; skipping outbound send. Message stored only.",
        { to, mediaUrl },
      );
      return {
        sid: "mock-sid",
        status: "queued",
        to,
        body,
      };
    }

    // Sanitize fromNumber to avoid double "whatsapp:" prefix if env var includes it
    const num = whatsappNumber || "";
    const envFrom = num.startsWith("whatsapp:") ? num : `whatsapp:${num}`;
    const from = fromNumber
      ? fromNumber.startsWith("whatsapp:")
        ? fromNumber
        : `whatsapp:${fromNumber}`
      : envFrom;

    console.log(`[Twilio] Sending from: ${from} to: ${to}`);

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
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
}

/**
 * Envía un mensaje de WhatsApp usando una plantilla aprobada por Meta.
 * Necesario para contactar a usuarios que no han escrito en las últimas 24h.
 */
export async function sendWhatsAppTemplate(
  to: string,
  contentSid: string,
  variables: Record<string, string>,
  fromNumber?: string,
) {
  try {
    if (!client) {
      console.log("[Twilio] Credentials missing; skipping template send.", { to, contentSid });
      return { sid: "mock-sid", status: "queued", to };
    }

    const num = whatsappNumber || "";
    const envFrom = num.startsWith("whatsapp:") ? num : `whatsapp:${num}`;
    const from = fromNumber
      ? fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`
      : envFrom;

    console.log(`[Twilio] Sending template ${contentSid} from: ${from} to: ${to}`);

    const message = await client.messages.create({
      from,
      to: `whatsapp:${to}`,
      contentSid,
      contentVariables: JSON.stringify(variables),
    } as any);

    return message;
  } catch (error) {
    console.error("[Twilio] Error sending WhatsApp template:", error);
    throw error;
  }
}

/**
 * Simula un delay humano antes de responder.
 * Un humano tarda ~3-5 segundos en escribir una respuesta corta.
 * Escala con el largo del mensaje para parecer más natural.
 */
export function humanDelay(responseLength: number): Promise<void> {
  // Base: 2s + ~1s por cada 30 caracteres, máximo 6s
  const ms = Math.min(2000 + Math.floor(responseLength / 30) * 1000, 6000);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Divide un mensaje largo en fragmentos para WhatsApp.
 * WhatsApp se lee mejor con mensajes cortos (< 160 chars).
 * Divide en saltos de línea dobles o puntos naturales.
 */
export function splitForWhatsApp(text: string, maxLen = 160): string[] {
  // Si es corto, no dividir
  if (text.length <= maxLen) return [text];

  // Intentar dividir en párrafos (doble salto de línea)
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  if (paragraphs.length > 1) return paragraphs.map((p) => p.trim());

  // Si no hay párrafos, dividir en oraciones
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return [text];

  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.length > 0 ? chunks : [text];
}
