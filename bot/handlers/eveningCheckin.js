import { appendJournalRow } from '../../services/googleSheets.js';
import { generateFeedback } from '../../services/aiCoach.js';

export async function handleEvening(ctx) {
  await ctx.reply('🌙 Evening reflection. Did you achieve your *main goal*? (Yes/No)');
  ctx.session = ctx.session || {};
  ctx.session.flow = { name: 'evening', step: 1, data: {} };
}

export async function continueEvening(ctx) {
  const f = ctx.session.flow;
  if (f.step === 1) {
    f.data.q1 = ctx.message.text;
    f.step = 2;
    return ctx.reply('What went *well* today?');
  }
  if (f.step === 2) {
    f.data.q2 = ctx.message.text;
    f.step = 3;
    return ctx.reply('What will you *improve* tomorrow?');
  }
  if (f.step === 3) {
    f.data.q3 = ctx.message.text;
    await appendJournalRow({ chat_id: ctx.chat.id, section: 'evening', ...f.data });
    const feedback = await generateFeedback(`Goal met: ${f.data.q1}. Wins: ${f.data.q2}. Improve: ${f.data.q3}.`);
    await ctx.reply(`🧾 Saved. Coach note: ${feedback}`);
    ctx.session.flow = null;
  }
}