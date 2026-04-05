import { randomUUID } from 'crypto';
import { getDb } from '@native/db/database';
import type { Project, CreateProjectInput, UpdateProjectInput } from '@native/db/types';

interface ProjectRow {
  id: string;
  workspace_id: string;
  name: string;
  path: string;
  quick_commands: string;
  sort_order: number;
  created_at: string;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    path: row.path,
    quickCommands: JSON.parse(row.quick_commands),
    sortOrder: row.sort_order,
    createdAt: row.created_at
  };
}

export function getAll(): Project[] {
  const rows = getDb().prepare('SELECT * FROM projects ORDER BY sort_order').all() as ProjectRow[];
  return rows.map(toProject);
}

export function getByWorkspace(workspaceId: string): Project[] {
  const rows = getDb()
    .prepare('SELECT * FROM projects WHERE workspace_id = ? ORDER BY sort_order')
    .all(workspaceId) as ProjectRow[];
  return rows.map(toProject);
}

export function create(input: CreateProjectInput): Project {
  const db = getDb();
  const maxOrder = db
    .prepare(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM projects WHERE workspace_id = ?'
    )
    .get(input.workspaceId) as { next: number };
  const row = db
    .prepare(
      'INSERT INTO projects (id, workspace_id, name, path, quick_commands, sort_order) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
    )
    .get(
      randomUUID(),
      input.workspaceId,
      input.name,
      input.path,
      JSON.stringify(input.quickCommands ?? []),
      maxOrder.next
    ) as ProjectRow;
  return toProject(row);
}

export function update(id: string, input: UpdateProjectInput): Project {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.path !== undefined) {
    fields.push('path = ?');
    values.push(input.path);
  }
  if (input.quickCommands !== undefined) {
    fields.push('quick_commands = ?');
    values.push(JSON.stringify(input.quickCommands));
  }
  if (input.sortOrder !== undefined) {
    fields.push('sort_order = ?');
    values.push(input.sortOrder);
  }

  if (fields.length === 0) {
    const row = getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow;
    return toProject(row);
  }

  values.push(id);
  const row = getDb()
    .prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ? RETURNING *`)
    .get(...values) as ProjectRow;
  return toProject(row);
}

export function remove(id: string): void {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
}
