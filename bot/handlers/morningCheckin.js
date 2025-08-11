import { appendJournalRow } from '../../services/googleSheets.js';
import { generateFeedback } from '../../services/aiCoach.js';

export async function handleMorning(ctx) {
  await ctx.reply('🌅 Morning! What is your *main goal* for today?');
  ctx.session = ctx.session || {};
  ctx.session.flow = { name: 'morning', step: 1, data: {} };
}

export async function continueMorning(ctx) {
  const flow = ctx.session.flow;
  if (flow.step === 1) {
    flow.data.q1 = ctx.message.text; // main goal
    flow.step = 2;
    return ctx.reply('On a scale of 1–10, how focused do you feel?');
  }
  if (flow.step === 2) {
    flow.data.q2 = ctx.message.text; // focus
    flow.step = 3;
    return ctx.reply('What *distractions* might get in your way?');
  }
  if (flow.step === 3) {
    flow.data.q3 = ctx.message.text; // distractions
    // Save to Sheets
    await appendJournalRow({
      chat_id: ctx.chat.id,
      section: 'morning',
      q1: flow.data.q1,
      q2: flow.data.q2,
      q3: flow.data.q3
    });
    const feedback = await generateFeedback(`Goal: ${flow.data.q1}. Focus: ${flow.data.q2}. Distractions: ${flow.data.q3}.`);
    await ctx.reply(`✅ Logged. Coach note: ${feedback}`);
    ctx.session.flow = null;
  }
}