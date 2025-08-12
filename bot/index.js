import { Telegraf, session } from 'telegraf';
import 'dotenv/config';
import cron from 'node-cron';
import { ensureTacticsSeeded } from '../services/policy/init.js';
import { q } from '../services/db.js';
import { nextCoachMove, reflectAndLearn } from '../services/coachBrain.js';
import { weeklySelfReview } from '../services/selfReview.js';
import { logger } from '../utils/logger.js';
import { handleMorning, continueMorning } from './handlers/morningCheckin.js';
import { handleMidday, continueMidday } from './handlers/middayCheckin.js';
import { handleEvening, continueEvening } from './handlers/eveningCheckin.js';
import { handleFallback } from './handlers/fallback.js';
import { registerSchedules } from './scheduler.js';
// your existing imports: handlers, googleSheets, etc.

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session({
  defaultSession: () => ({ mode: 'wizard' })
}));

// Simple in-memory registry of chat IDs (replace with DB later)
const subscribers = new Set();
const getSubscribers = async () => Array.from(subscribers);

bot.start(async (ctx) => {
  subscribers.add(ctx.chat.id);
  await ctx.reply('Hey! I am your Performance Coach Bot. Try /morning, /midday, or /evening. I will also nudge you daily.');
});

// Seed tactics at boot
ensureTacticsSeeded();

// --- Commands ---
bot.command('morning', handleMorning);
bot.command('midday', handleMidday);
bot.command('evening', handleEvening);
bot.command('mode', async (ctx) => {
  const modes = ['coach','planner','analyst','accountability','wizard'];
  const choice = (ctx.message.text.split(' ')[1] || '').toLowerCase();
  if (!modes.includes(choice)) {
    return ctx.reply(`Modes: ${modes.map(m=>`/mode ${m}`).join('  ')}\nCurrent: ${ctx.session?.mode || 'wizard'}`);
  }
  ctx.session.mode = choice;
  await ctx.reply(`Mode set to *${choice}*`, { parse_mode: 'Markdown' });
});

bot.command('goal', async (ctx) => {
  const text = ctx.message.text.replace(/^\/goal\s*/,'').trim();
  if (!text) return ctx.reply('Usage: /goal <your main goal>');
  q.run(`INSERT INTO goals(chat_id,start_date,horizon,text,status) VALUES(?,?,?,?,?)`,
    String(ctx.chat.id), new Date().toISOString().slice(0,10), 'week', text, 'active');
  await ctx.reply('🎯 Weekly goal set.');
});

bot.command('done', async (ctx) => {
  // mark today done; reflect to update bandit
  const today = new Date().toISOString().slice(0,10);
  q.run(`INSERT INTO daily(chat_id,date,done) VALUES(?,?,1)
         ON CONFLICT DO NOTHING`, String(ctx.chat.id), today);
  reflectAndLearn(ctx.chat.id, { done: 1, focus: 0, energy: 0 });
  await ctx.reply('✅ Marked done for today. Nice work!');
});

bot.command('review', async (ctx) => {
  const r = weeklySelfReview();
  const lines = r.rows.map(x => `• ${x.tactic_key}: pulls=${x.c}, avg=${x.avg}`);
  await ctx.reply([
    '🧪 Weekly self‑review:',
    ...lines,
    r.suggestion ? `\n➡️ ${r.suggestion}` : '',
    r.prune ? `\n⚠️ ${r.prune}` : ''
  ].join('\n'));
});

// Fallback to agent in non-wizard modes
bot.on('text', async (ctx) => {
  const mode = ctx.session.mode || 'wizard';
  if (mode === 'wizard') {
    const flow = ctx.session?.flow;
    if (!flow) return handleFallback(ctx);
    if (flow.name === 'morning') return continueMorning(ctx);
    if (flow.name === 'midday') return continueMidday(ctx);
    if (flow.name === 'evening') return continueEvening(ctx);
    return ctx.reply('Use /mode coach to switch to adaptive coaching.');
  }
  // pull active weekly goal (if any)
  const g = q.get(`SELECT text FROM goals WHERE chat_id=? AND status='active' ORDER BY id DESC LIMIT 1`, String(ctx.chat.id));
  await nextCoachMove(ctx, { goal: g?.text || null });
});

// --- Reminder dispatcher (runs every minute) ---
cron.schedule('* * * * *', async () => {
  const now = new Date().toISOString();
  const due = q.all(`SELECT * FROM reminders WHERE sent=0 AND due_ts <= ?`, now);
  for (const r of due) {
    try {
      await bot.telegram.sendMessage(r.chat_id, `🔔 ${r.message}`);
      q.run(`UPDATE reminders SET sent=1 WHERE id=?`, r.id);
    } catch (e) {
      console.error('Reminder send failed:', e.message);
    }
  }
});

// Register daily schedules
const stop = registerSchedules(bot, getSubscribers);

bot.launch().then(() => logger.info('Bot launched')).catch((e) => logger.error(e));

process.once('SIGINT', () => { stop?.(); bot.stop('SIGINT'); });
process.once('SIGTERM', () => { stop?.(); bot.stop('SIGTERM'); });
