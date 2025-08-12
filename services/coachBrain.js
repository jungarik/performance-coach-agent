import { q } from './db.js';
import { pickUCB1, updateArm } from './policy/bandit.js';
import { TOOLBOX } from './agentTools.js';

// Pick next tactic, speak, act, and record interaction
export async function nextCoachMove(ctx, { goal } = {}) {
  const arms = q.all(`SELECT * FROM tactics`);
  const key = pickUCB1(arms);
  const arm = arms.find(a => a.key === key);

  const prefix = goal ? `Goal: ${goal}\n` : '';
  const message = `${prefix}${arm.prompt}`;

  await ctx.reply(message);

  // Execute suggested tool (if any)
  let actionArgs = {};
  if (arm.tool && TOOLBOX[arm.tool]) {
    actionArgs = arm.args_json ? JSON.parse(arm.args_json) : {};
    await TOOLBOX[arm.tool](ctx, actionArgs);
  }

  q.run(
    `INSERT INTO interactions(chat_id, ts, tactic_key, message, action_json)
     VALUES(?,?,?,?,?)`,
    String(ctx.chat.id),
    new Date().toISOString(),
    arm.key,
    message,
    JSON.stringify(actionArgs)
  );
}

// Called when we get outcome signals (e.g., /done, evening check-in)
export function reflectAndLearn(chat_id, { done = 0, focus = 0, energy = 0 } = {}) {
  const last = q.get(
    `SELECT * FROM interactions WHERE chat_id=? ORDER BY id DESC LIMIT 1`,
    String(chat_id)
  );
  if (!last) return;

  const arm = q.get(`SELECT * FROM tactics WHERE key=?`, last.tactic_key);
  let score = 0;
  if (done) score = 1;
  else if (focus >= 8) score = 0.8;
  else if (energy >= 8) score = 0.5;

  const upd = updateArm(arm, score);
  q.run(`UPDATE tactics SET pulls=?, rewards=? WHERE key=?`, upd.pulls, upd.rewards, upd.key);
  q.run(`UPDATE interactions SET outcome_score=? WHERE id=?`, score, last.id);
}
