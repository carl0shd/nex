import { randomUUID } from 'crypto';
import { getDb } from '@native/db/database';
import type { Worktree, CreateWorktreeInput, UpdateWorktreeInput } from '@native/db/types';

interface WorktreeRow {
  id: string;
  project_id: string;
  branch: string;
  path: string;
  dot_color: string;
  active: number;
  notes: string;
  sort_order: number;
  created_at: string;
}

function toWorktree(row: WorktreeRow): Worktree {
  return {
    id: row.id,
    projectId: row.project_id,
    branch: row.branch,
    path: row.path,
    dotColor: row.dot_color,
    active: row.active === 1,
    notes: row.notes,
    sortOrder: row.sort_order,
    createdAt: row.created_at
  };
}

export function getAll(): Worktree[] {
  const rows = getDb()
    .prepare('SELECT * FROM worktrees ORDER BY sort_order')
    .all() as WorktreeRow[];
  return rows.map(toWorktree);
}

export function getByProject(projectId: string): Worktree[] {
  const rows = getDb()
    .prepare('SELECT * FROM worktrees WHERE project_id = ? ORDER BY sort_order')
    .all(projectId) as WorktreeRow[];
  return rows.map(toWorktree);
}

export function create(input: CreateWorktreeInput): Worktree {
  const db = getDb();
  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM worktrees WHERE project_id = ?')
    .get(input.projectId) as { next: number };
  const row = db
    .prepare(
      'INSERT INTO worktrees (id, project_id, branch, path, dot_color, sort_order) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
    )
    .get(
      randomUUID(),
      input.projectId,
      input.branch,
      input.path,
      input.dotColor ?? '#636363',
      maxOrder.next
    ) as WorktreeRow;
  return toWorktree(row);
}

export function update(id: string, input: UpdateWorktreeInput): Worktree {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.branch !== undefined) {
    fields.push('branch = ?');
    values.push(input.branch);
  }
  if (input.path !== undefined) {
    fields.push('path = ?');
    values.push(input.path);
  }
  if (input.dotColor !== undefined) {
    fields.push('dot_color = ?');
    values.push(input.dotColor);
  }
  if (input.active !== undefined) {
    fields.push('active = ?');
    values.push(input.active ? 1 : 0);
  }
  if (input.notes !== undefined) {
    fields.push('notes = ?');
    values.push(input.notes);
  }
  if (input.sortOrder !== undefined) {
    fields.push('sort_order = ?');
    values.push(input.sortOrder);
  }

  if (fields.length === 0) {
    const row = getDb().prepare('SELECT * FROM worktrees WHERE id = ?').get(id) as WorktreeRow;
    return toWorktree(row);
  }

  values.push(id);
  const row = getDb()
    .prepare(`UPDATE worktrees SET ${fields.join(', ')} WHERE id = ? RETURNING *`)
    .get(...values) as WorktreeRow;
  return toWorktree(row);
}

export function remove(id: string): void {
  getDb().prepare('DELETE FROM worktrees WHERE id = ?').run(id);
}
