// Lightweight SQLite bootstrap with better-sqlite3 (sync, fast, no deps)
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const DATA_DIR = process.env.DB_DIR || './data';
const DB_PATH  = process.env.DATABASE_PATH || path.join(DATA_DIR, 'coach.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// --- Schema (idempotent) ---
db.exec(`
CREATE TABLE IF NOT EXISTS goals(
  id INTEGER PRIMARY KEY,
  chat_id TEXT,
  start_date TEXT,
  horizon TEXT,     -- 'day' | 'week' | etc.
  text TEXT,
  status TEXT       -- 'active' | 'done' | 'dropped'
);

CREATE TABLE IF NOT EXISTS daily(
  id INTEGER PRIMARY KEY,
  chat_id TEXT,
  date TEXT,        -- ISO date yyyy-mm-dd
  focus INTEGER,    -- 1..10
  energy INTEGER,   -- 1..10
  mood INTEGER,     -- 1..10
  main_goal TEXT,
  done INTEGER,     -- 0/1
  obstacles TEXT
);

CREATE TABLE IF NOT EXISTS tactics(
  id INTEGER PRIMARY KEY,
  key TEXT UNIQUE,
  prompt TEXT,
  tool TEXT,
  args_json TEXT,
  pulls INTEGER DEFAULT 0,
  rewards REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS interactions(
  id INTEGER PRIMARY KEY,
  chat_id TEXT,
  ts TEXT,
  tactic_key TEXT,
  message TEXT,
  action_json TEXT,
  outcome_score REAL
);

CREATE TABLE IF NOT EXISTS reminders(
  id INTEGER PRIMARY KEY,
  chat_id TEXT,
  due_ts TEXT,
  message TEXT,
  sent INTEGER DEFAULT 0
);
`);

// --- Helpers ---
export const q = {
  get: (sql, ...args) => db.prepare(sql).get(...args),
  all: (sql, ...args) => db.prepare(sql).all(...args),
  run: (sql, ...args) => db.prepare(sql).run(...args),
};

export default db;
