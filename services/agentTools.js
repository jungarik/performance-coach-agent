import { appendJournalRow } from './googleSheets.js';
import { q } from './db.js';

export async function set_goal(ctx, args) {
  await appendJournalRow({ chat_id: ctx.chat.id, section: 'goal', q1: args?.text || '' });
  await ctx.reply('🎯 Goal noted.');
}

export async function log_note(ctx, args) {
  await appendJournalRow({ chat_id: ctx.chat.id, section: 'note', q1: args?.text || '' });
  await ctx.reply('📝 Noted.');
}

// Accepts time like "+30m" or "+2h"
function parseRelativeTime(s) {
  const m = String(s || '').match(/^\+(\d+)([mh])$/i);
  if (!m) return new Date(Date.now() + 30 * 60 * 1000); // default +30m
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const ms = unit === 'h' ? n * 3600000 : n * 60000;
  return new Date(Date.now() + ms);
}

export async function schedule_nudge(ctx, args) {
  const { time = '+30m', msg = 'Check‑in' } = args || {};
  const due = parseRelativeTime(time).toISOString();
  q.run(`INSERT INTO reminders(chat_id, due_ts, message, sent) VALUES(?,?,?,0)`,
        String(ctx.chat.id), due, msg);
  await ctx.reply(`⏰ I’ll nudge you ${time} from now: “${msg}”.`);
}

export async function plan_day(ctx, args) {
  const { week_goal = 'Make progress', constraints = '' } = args || {};
  const plan = [
    'Define 3 outcome‑based tasks for today',
    '1× 50‑min deep work block on Task 1',
    '2× 25‑min sprints on Tasks 2–3'
  ];
  await appendJournalRow({ chat_id: ctx.chat.id, section: 'plan', q1: week_goal, q2: constraints, q3: plan.join(' | ') });
  await ctx.reply('🗓 Plan:\n• ' + plan.join('\n• '));
}

export async function get_stats(ctx) {
  await ctx.reply('📊 Stats prototype: streak 3 days, avg focus 7.2.'); // TODO: compute from Sheets/DB
}

export const TOOLBOX = { set_goal, log_note, schedule_nudge, plan_day, get_stats };
