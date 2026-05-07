import { randomUUID } from 'crypto';
import { getDb } from '@native/db/database';
import type {
  Terminal,
  CreateTerminalInput,
  UpdateTerminalInput,
  TerminalStatus,
  TerminalType
} from '@native/db/types';

interface TerminalRow {
  id: string;
  session_id: string;
  name: string;
  command: string | null;
  args: string;
  cwd: string;
  env: string;
  is_primary: number;
  sort_order: number;
  status: string;
  type: string;
  run_command: string | null;
  created_at: string;
}

function toTerminal(row: TerminalRow): Terminal {
  return {
    id: row.id,
    sessionId: row.session_id,
    name: row.name,
    command: row.command,
    args: JSON.parse(row.args),
    cwd: row.cwd,
    env: JSON.parse(row.env),
    isPrimary: row.is_primary === 1,
    sortOrder: row.sort_order,
    status: (row.status as TerminalStatus) ?? 'idle',
    type: (row.type as TerminalType) ?? 'shell',
    runCommand: row.run_command,
    createdAt: row.created_at
  };
}

export function getAll(): Terminal[] {
  const rows = getDb()
    .prepare('SELECT * FROM terminals ORDER BY sort_order ASC, created_at ASC')
    .all() as TerminalRow[];
  return rows.map(toTerminal);
}

export function getBySession(sessionId: string): Terminal[] {
  const rows = getDb()
    .prepare('SELECT * FROM terminals WHERE session_id = ? ORDER BY sort_order ASC, created_at ASC')
    .all(sessionId) as TerminalRow[];
  return rows.map(toTerminal);
}

export function getById(id: string): Terminal | null {
  const row = getDb().prepare('SELECT * FROM terminals WHERE id = ?').get(id) as
    | TerminalRow
    | undefined;
  return row ? toTerminal(row) : null;
}

export function create(input: CreateTerminalInput): Terminal {
  const { next } = getDb()
    .prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM terminals WHERE session_id = ?')
    .get(input.sessionId) as { next: number };

  const row = getDb()
    .prepare(
      `INSERT INTO terminals (id, session_id, name, command, args, cwd, env, is_primary, sort_order, type, run_command)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    )
    .get(
      randomUUID(),
      input.sessionId,
      input.name,
      input.command ?? null,
      JSON.stringify(input.args ?? []),
      input.cwd,
      JSON.stringify(input.env ?? {}),
      input.isPrimary ? 1 : 0,
      next,
      input.type ?? 'shell',
      input.runCommand ?? null
    ) as TerminalRow;
  return toTerminal(row);
}

export function update(id: string, input: UpdateTerminalInput): Terminal {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.sortOrder !== undefined) {
    fields.push('sort_order = ?');
    values.push(input.sortOrder);
  }

  if (fields.length === 0) return getById(id)!;

  values.push(id);
  const row = getDb()
    .prepare(`UPDATE terminals SET ${fields.join(', ')} WHERE id = ? RETURNING *`)
    .get(...values) as TerminalRow;
  return toTerminal(row);
}

export function remove(id: string): void {
  getDb().prepare('DELETE FROM terminals WHERE id = ?').run(id);
}

export function removeBySession(sessionId: string): void {
  getDb().prepare('DELETE FROM terminals WHERE session_id = ?').run(sessionId);
}

export function setStatus(id: string, status: TerminalStatus): void {
  getDb().prepare('UPDATE terminals SET status = ? WHERE id = ?').run(status, id);
}

export function clearRunCommand(id: string): void {
  getDb().prepare('UPDATE terminals SET run_command = NULL WHERE id = ?').run(id);
}

export function resetAllStatus(): void {
  getDb().prepare("UPDATE terminals SET status = 'idle'").run();
}
