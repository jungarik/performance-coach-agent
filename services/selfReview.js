import { q } from './db.js';

export function weeklySelfReview() {
  const rows = q.all(`
    SELECT tactic_key, COUNT(*) c, ROUND(AVG(COALESCE(outcome_score,0)),3) AS avg
    FROM interactions
    WHERE ts >= datetime('now','-7 day')
    GROUP BY tactic_key
    ORDER BY avg DESC
  `);
  const top = rows[0];
  const low = rows[rows.length - 1];
  const suggestion = top ? `Double‑down on "${top.tactic_key}" next week.` : 'Need more data.';
  const prune = low && low.avg < 0.2 ? `Consider rewriting "${low.tactic_key}".` : null;
  return { rows, suggestion, prune };
}
