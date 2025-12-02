import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are a helpful customer support assistant for a company.
Your goal is to assist users with their inquiries politely and efficiently.
If you don't know the answer, ask for more details or say you will connect them with a human agent.
Keep your responses concise and suitable for WhatsApp (avoid long paragraphs).
`;

/**
 * Generates a response using OpenAI's Chat Completion API.
 * 
 * @param history - Array of previous messages in the conversation (role: 'user' | 'assistant' | 'system').
 * @returns The generated text response from the AI, or null if an error occurs.
 */
export async function generateAIResponse(history: { role: 'user' | 'assistant' | 'system'; content: string }[]) {
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Using a cost-effective model for high-volume chat
            messages: [
                { role: 'system', content: SYSTEM_PROMPT }, // Inject system instructions first
                ...history,
            ],
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating AI response:', error);
        return null;
    }
}
