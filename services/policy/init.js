import { q } from '../db.js';
import { SEED_TACTICS } from './tactics.seed.js';

export function ensureTacticsSeeded() {
  for (const t of SEED_TACTICS) {
    const exists = q.get(`SELECT 1 FROM tactics WHERE key=?`, t.key);
    if (!exists) {
      q.run(
        `INSERT INTO tactics(key,prompt,tool,args_json,pulls,rewards) VALUES(?,?,?,?,0,0)`,
        t.key, t.prompt, t.tool || null, JSON.stringify(t.args || {})
      );
    }
  }
}