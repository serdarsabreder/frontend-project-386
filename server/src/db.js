import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'call-booking.db');

// Schema owned by the AI agent: a UNIQUE constraint on start_time is the
// concurrency guard that turns double-booking attempts into SQLITE_CONSTRAINT
// violations, which the API surfaces as HTTP 409 Conflict.
export function createDb(dbPath = process.env.DB_PATH || DEFAULT_DB_PATH) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_date  TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time   TEXT NOT NULL,
      name       TEXT NOT NULL,
      email      TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (start_time)
    );
  `);

  return db;
}
