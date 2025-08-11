export async function handleFallback(ctx) {
  await ctx.reply('I didn’t catch that. Try /morning, /midday, or /evening.');
}