import cron from 'node-cron';
import { logger } from '../utils/logger.js';

function parseTimeStr(t) {
  // Expect HH:MM 24h
  const [h, m] = (t || '').split(':').map(Number);
  if (Number.isInteger(h) && Number.isInteger(m)) return { h, m };
  return { h: 9, m: 0 };
}

export function registerSchedules(bot, chatIdProvider) {
  const tz = process.env.DEFAULT_TZ || 'Europe/Kyiv';

  const { h: mh, m: mm } = parseTimeStr(process.env.CHECKIN_MORNING || '08:30');
  const { h: dh, m: dm } = parseTimeStr(process.env.CHECKIN_MIDDAY || '13:00');
  const { h: eh, m: em } = parseTimeStr(process.env.CHECKIN_EVENING || '20:30');

  const mk = cron.schedule(`${mm} ${mh} * * *`, async () => {
    for (const chatId of await chatIdProvider()) {
      await bot.telegram.sendMessage(chatId, '⏰ Morning nudge: type /morning to plan your day.');
    }
  }, { timezone: tz });

  const dk = cron.schedule(`${dm} ${dh} * * *`, async () => {
    for (const chatId of await chatIdProvider()) {
      await bot.telegram.sendMessage(chatId, '⏰ Midday nudge: type /midday to recalibrate.');
    }
  }, { timezone: tz });

  const ek = cron.schedule(`${em} ${eh} * * *`, async () => {
    for (const chatId of await chatIdProvider()) {
      await bot.telegram.sendMessage(chatId, '⏰ Evening nudge: type /evening to reflect.');
    }
  }, { timezone: tz });

  logger.info('Schedules registered', { tz });
  return () => { mk.stop(); dk.stop(); ek.stop(); };
}