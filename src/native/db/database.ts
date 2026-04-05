import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { runMigrations } from './migrations';

let db: Database.Database;

const NEX_DIR = join(process.env.HOME!, '.nex');
const DB_PATH = join(NEX_DIR, 'nex.db');

export function initDatabase(): void {
  mkdirSync(NEX_DIR, { recursive: true });
  const dbPath = DB_PATH;
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);
}

export function getDb(): Database.Database {
  return db;
}

export function closeDatabase(): void {
  if (db) db.close();
}
