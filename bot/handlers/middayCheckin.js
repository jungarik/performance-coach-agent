import { appendJournalRow } from '../../services/googleSheets.js';
import { generateFeedback } from '../../services/aiCoach.js';

export async function handleMidday(ctx) {
  await ctx.reply('🕑 Midday check-in. Are you on track? (Yes/No)');
  ctx.session = ctx.session || {};
  ctx.session.flow = { name: 'midday', step: 1, data: {} };
}

export async function continueMidday(ctx) {
  const f = ctx.session.flow;
  if (f.step === 1) {
    f.data.q1 = ctx.message.text;
    f.step = 2;
    return ctx.reply('What’s the biggest blocker right now?');
  }
  if (f.step === 2) {
    f.data.q2 = ctx.message.text;
    f.step = 3;
    return ctx.reply('What’s the *next* concrete action?');
  }
  if (f.step === 3) {
    f.data.q3 = ctx.message.text;
    await appendJournalRow({ chat_id: ctx.chat.id, section: 'midday', ...f.data });
    const feedback = await generateFeedback(`On track: ${f.data.q1}. Blocker: ${f.data.q2}. Next action: ${f.data.q3}.`);
    await ctx.reply(`👌 Logged. Coach note: ${feedback}`);
    ctx.session.flow = null;
  }
}