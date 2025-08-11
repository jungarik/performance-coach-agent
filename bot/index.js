import 'dotenv/config';
import { Telegraf, session } from 'telegraf';
import { logger } from '../utils/logger.js';
import { handleMorning, continueMorning } from './handlers/morningCheckin.js';
import { handleMidday, continueMidday } from './handlers/middayCheckin.js';
import { handleEvening, continueEvening } from './handlers/eveningCheckin.js';
import { handleFallback } from './handlers/fallback.js';
import { registerSchedules } from './scheduler.js';

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) {
  logger.error('BOT_TOKEN is not set');
  process.exit(1);
}

const bot = new Telegraf(TOKEN);
bot.use(session());

// Simple in-memory registry of chat IDs (replace with DB later)
const subscribers = new Set();
const getSubscribers = async () => Array.from(subscribers);

bot.start(async (ctx) => {
  subscribers.add(ctx.chat.id);
  await ctx.reply('Hey! I am your Performance Coach Bot. Try /morning, /midday, or /evening. I will also nudge you daily.');
});

bot.command('help', async (ctx) => {
  await ctx.reply('Commands: /morning /midday /evening /help');
});

bot.command('morning', handleMorning);
bot.command('midday', handleMidday);
bot.command('evening', handleEvening);

bot.on('text', async (ctx) => {
  const flow = ctx.session?.flow;
  if (!flow) return handleFallback(ctx);
  if (flow.name === 'morning') return continueMorning(ctx);
  if (flow.name === 'midday') return continueMidday(ctx);
  if (flow.name === 'evening') return continueEvening(ctx);
  return handleFallback(ctx);
});

// Register daily schedules
const stop = registerSchedules(bot, getSubscribers);

bot.launch().then(() => logger.info('Bot launched')).catch((e) => logger.error(e));

process.once('SIGINT', () => { stop?.(); bot.stop('SIGINT'); });
process.once('SIGTERM', () => { stop?.(); bot.stop('SIGTERM'); });