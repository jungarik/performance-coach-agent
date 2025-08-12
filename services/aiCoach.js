// Optional AI feedback. If OPENAI_API_KEY is absent, returns a short heuristic reply.
import { logger } from '../utils/logger.js';

let OpenAIClient = null;

try {
  const mod = await import('openai');
  OpenAIClient = mod.default;
} catch (_) {}

const SYSTEM_PROMPT = `You are a brief, practical performance coach. Keep replies under 80 words. Use a supportive but accountable tone. Offer 1 concrete suggestion.`;

export async function generateFeedback(summary) {
  if (!process.env.OPENAI_API_KEY || !OpenAIClient) {
    // Simple heuristic fallback
    const tip = summary.includes('distract') || summary.includes('social')
      ? 'Mute notifications for 45 minutes and batch messages at set times.'
      : 'Break the next task into a 25-minute focus sprint with a 5-minute break.';
    return `Noted. Stay consistent. ${tip}`;
  }
  try {
    const client = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: summary }
      ],
      temperature: 0.5,
      max_tokens: 120
    });
    return res.choices?.[0]?.message?.content?.trim()
      || 'Good job. Keep your next action small and specific.';
  } catch (e) {
    logger.error('OpenAI error', e.message);
    return 'Good job. Keep your next action small and specific.';
  }
}
