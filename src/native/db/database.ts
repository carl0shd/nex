import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { runMigrations } from './migrations';
import { getNexDir } from '@native/paths';

let db: Database.Database;

export function initDatabase(): void {
  const nexDir = getNexDir();
  mkdirSync(nexDir, { recursive: true });
  const dbPath = join(nexDir, 'nex.db');
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
