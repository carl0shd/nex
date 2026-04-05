import { randomUUID } from 'crypto';
import { getDb } from '@native/db/database';
import type { Session, CreateSessionInput, UpdateSessionInput } from '@native/db/types';

interface SessionRow {
  id: string;
  project_id: string;
  agent_id: string | null;
  account_id: string | null;
  name: string;
  branch: string;
  base_branch: string;
  worktree_path: string;
  notes_path: string;
  symlinks: string;
  status: string;
  opens: number;
  created_at: string;
  last_opened: string;
}

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    projectId: row.project_id,
    agentId: row.agent_id,
    accountId: row.account_id,
    name: row.name,
    branch: row.branch,
    baseBranch: row.base_branch,
    worktreePath: row.worktree_path,
    notesPath: row.notes_path,
    symlinks: JSON.parse(row.symlinks),
    status: row.status as Session['status'],
    opens: row.opens,
    createdAt: row.created_at,
    lastOpened: row.last_opened
  };
}

export function getAll(): Session[] {
  const rows = getDb()
    .prepare('SELECT * FROM sessions ORDER BY created_at DESC')
    .all() as SessionRow[];
  return rows.map(toSession);
}

export function getByProject(projectId: string): Session[] {
  const rows = getDb()
    .prepare('SELECT * FROM sessions WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId) as SessionRow[];
  return rows.map(toSession);
}

export function getByName(name: string, projectId?: string): Session | null {
  const sql = projectId
    ? 'SELECT * FROM sessions WHERE name = ? AND project_id = ?'
    : 'SELECT * FROM sessions WHERE name = ?';
  const args = projectId ? [name, projectId] : [name];
  const row = getDb()
    .prepare(sql)
    .get(...args) as SessionRow | undefined;
  return row ? toSession(row) : null;
}

export function getActive(): Session[] {
  const rows = getDb()
    .prepare("SELECT * FROM sessions WHERE status = 'active' ORDER BY last_opened DESC")
    .all() as SessionRow[];
  return rows.map(toSession);
}

export function create(input: CreateSessionInput): Session {
  const row = getDb()
    .prepare(
      `INSERT INTO sessions (id, project_id, agent_id, account_id, name, branch, base_branch, worktree_path, notes_path, symlinks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    )
    .get(
      randomUUID(),
      input.projectId,
      input.agentId ?? null,
      input.accountId ?? null,
      input.name,
      input.branch,
      input.baseBranch,
      input.worktreePath,
      input.notesPath ?? '',
      JSON.stringify(input.symlinks ?? [])
    ) as SessionRow;
  return toSession(row);
}

export function update(id: string, input: UpdateSessionInput): Session {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.status !== undefined) {
    fields.push('status = ?');
    values.push(input.status);
  }
  if (input.opens !== undefined) {
    fields.push('opens = ?');
    values.push(input.opens);
  }
  if (input.lastOpened !== undefined) {
    fields.push('last_opened = ?');
    values.push(input.lastOpened);
  }

  if (fields.length === 0) {
    const row = getDb().prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow;
    return toSession(row);
  }

  values.push(id);
  const row = getDb()
    .prepare(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ? RETURNING *`)
    .get(...values) as SessionRow;
  return toSession(row);
}

export function remove(id: string): void {
  getDb().prepare('DELETE FROM sessions WHERE id = ?').run(id);
}
