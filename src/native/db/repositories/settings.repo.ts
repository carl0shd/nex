import { getDb } from '@native/db/database';

export function get<T>(key: string, fallback: T): T {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row ? JSON.parse(row.value) : fallback;
}

export function set(key: string, value: unknown): void {
  getDb()
    .prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?'
    )
    .run(key, JSON.stringify(value), JSON.stringify(value));
}

export function remove(key: string): void {
  getDb().prepare('DELETE FROM settings WHERE key = ?').run(key);
}
