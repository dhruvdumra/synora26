import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { databasePath, startBlock } from './config.ts'

mkdirSync(dirname(databasePath), { recursive: true })

export const db = new DatabaseSync(databasePath)

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;

  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS passes (
    token_id INTEGER PRIMARY KEY,
    holder TEXT NOT NULL,
    sessions INTEGER NOT NULL DEFAULT 0,
    talks INTEGER NOT NULL DEFAULT 0,
    networking INTEGER NOT NULL DEFAULT 0,
    connections INTEGER NOT NULL DEFAULT 0,
    is_speaker INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    tier INTEGER NOT NULL DEFAULT 0,
    minted_at INTEGER NOT NULL DEFAULT 0,
    updated_block INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    attendance INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block INTEGER NOT NULL,
    log_index INTEGER NOT NULL,
    tx_hash TEXT NOT NULL,
    kind TEXT NOT NULL,
    token_id INTEGER,
    session_id INTEGER,
    detail TEXT,
    UNIQUE (tx_hash, log_index)
  );

  CREATE INDEX IF NOT EXISTS idx_passes_score ON passes (score DESC, token_id ASC);
  CREATE INDEX IF NOT EXISTS idx_activity_recent ON activity (block DESC, id DESC);
`)

const readCursor = db.prepare('SELECT value FROM meta WHERE key = ?')
const writeCursor = db.prepare(
  'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
)

export function getCursor(): bigint {
  const row = readCursor.get('cursor') as { value: string } | undefined
  return row ? BigInt(row.value) : startBlock - 1n
}

export function setCursor(block: bigint) {
  writeCursor.run('cursor', block.toString())
}

export const statements = {
  upsertPass: db.prepare(`
    INSERT INTO passes (token_id, holder, sessions, talks, networking, connections, is_speaker, score, tier,
      minted_at, updated_block)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (token_id) DO UPDATE SET
      holder = excluded.holder, sessions = excluded.sessions, talks = excluded.talks,
      networking = excluded.networking, connections = excluded.connections, is_speaker = excluded.is_speaker,
      score = excluded.score, tier = excluded.tier, minted_at = excluded.minted_at,
      updated_block = excluded.updated_block
  `),
  upsertSession: db.prepare(`
    INSERT INTO sessions (id, name, active, attendance, created_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET
      name = excluded.name, active = excluded.active, attendance = excluded.attendance,
      created_at = excluded.created_at
  `),
  insertActivity: db.prepare(`
    INSERT OR IGNORE INTO activity (block, log_index, tx_hash, kind, token_id, session_id, detail)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  leaderboard: db.prepare(`
    SELECT token_id, holder, sessions, talks, networking, connections, is_speaker, score, tier, minted_at
    FROM passes ORDER BY score DESC, token_id ASC LIMIT ?
  `),
  pass: db.prepare(`
    SELECT token_id, holder, sessions, talks, networking, connections, is_speaker, score, tier, minted_at,
      updated_block
    FROM passes WHERE token_id = ?
  `),
  passByHolder: db.prepare('SELECT token_id FROM passes WHERE holder = ? COLLATE NOCASE'),
  sessions: db.prepare('SELECT id, name, active, attendance, created_at FROM sessions ORDER BY id DESC'),
  activity: db.prepare(`
    SELECT block, tx_hash, kind, token_id, session_id, detail
    FROM activity ORDER BY block DESC, id DESC LIMIT ?
  `),
  stats: db.prepare(`
    SELECT COUNT(*) AS passes, COALESCE(SUM(sessions), 0) AS check_ins, COALESCE(SUM(talks), 0) AS talks,
      COALESCE(SUM(connections), 0) AS connections
    FROM passes
  `),
}
