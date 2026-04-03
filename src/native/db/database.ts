import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { runMigrations } from './migrations';

let db: Database.Database;

export function initDatabase(): void {
  const dbPath = join(app.getPath('userData'), 'nex.db');
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
