import { randomUUID } from 'crypto';
import { getDb } from '@native/db/database';
import type { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput } from '@native/db/types';

interface WorkspaceRow {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  collapsed: number;
  created_at: string;
}

function toWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
    collapsed: row.collapsed === 1,
    createdAt: row.created_at
  };
}

export function getAll(): Workspace[] {
  const rows = getDb()
    .prepare('SELECT * FROM workspaces ORDER BY sort_order')
    .all() as WorkspaceRow[];
  return rows.map(toWorkspace);
}

export function getById(id: string): Workspace | null {
  const row = getDb().prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as
    | WorkspaceRow
    | undefined;
  return row ? toWorkspace(row) : null;
}

export function create(input: CreateWorkspaceInput): Workspace {
  const db = getDb();
  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM workspaces')
    .get() as { next: number };
  const row = db
    .prepare('INSERT INTO workspaces (id, name, color, sort_order) VALUES (?, ?, ?, ?) RETURNING *')
    .get(randomUUID(), input.name, input.color, maxOrder.next) as WorkspaceRow;
  return toWorkspace(row);
}

export function update(id: string, input: UpdateWorkspaceInput): Workspace {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.color !== undefined) {
    fields.push('color = ?');
    values.push(input.color);
  }
  if (input.sortOrder !== undefined) {
    fields.push('sort_order = ?');
    values.push(input.sortOrder);
  }
  if (input.collapsed !== undefined) {
    fields.push('collapsed = ?');
    values.push(input.collapsed ? 1 : 0);
  }

  if (fields.length === 0) return getById(id)!;

  values.push(id);
  const row = getDb()
    .prepare(`UPDATE workspaces SET ${fields.join(', ')} WHERE id = ? RETURNING *`)
    .get(...values) as WorkspaceRow;
  return toWorkspace(row);
}

export function remove(id: string): void {
  getDb().prepare('DELETE FROM workspaces WHERE id = ?').run(id);
}
