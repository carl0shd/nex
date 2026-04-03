import { randomUUID } from 'crypto';
import { getDb } from '@native/db/database';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@native/db/types';

interface TaskRow {
  id: string;
  project_id: string;
  worktree_id: string | null;
  name: string;
  status: string;
  created_at: string;
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    worktreeId: row.worktree_id,
    name: row.name,
    status: row.status as Task['status'],
    createdAt: row.created_at
  };
}

export function getAll(): Task[] {
  const rows = getDb().prepare('SELECT * FROM tasks ORDER BY created_at').all() as TaskRow[];
  return rows.map(toTask);
}

export function getByProject(projectId: string): Task[] {
  const rows = getDb()
    .prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at')
    .all(projectId) as TaskRow[];
  return rows.map(toTask);
}

export function create(input: CreateTaskInput): Task {
  const row = getDb()
    .prepare(
      'INSERT INTO tasks (id, project_id, worktree_id, name) VALUES (?, ?, ?, ?) RETURNING *'
    )
    .get(randomUUID(), input.projectId, input.worktreeId ?? null, input.name) as TaskRow;
  return toTask(row);
}

export function update(id: string, input: UpdateTaskInput): Task {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.status !== undefined) {
    fields.push('status = ?');
    values.push(input.status);
  }
  if (input.worktreeId !== undefined) {
    fields.push('worktree_id = ?');
    values.push(input.worktreeId);
  }

  if (fields.length === 0) {
    const row = getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow;
    return toTask(row);
  }

  values.push(id);
  const row = getDb()
    .prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ? RETURNING *`)
    .get(...values) as TaskRow;
  return toTask(row);
}

export function remove(id: string): void {
  getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id);
}
