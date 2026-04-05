import { randomUUID } from 'crypto';
import { getDb } from '@native/db/database';
import type { Agent, CreateAgentInput, UpdateAgentInput } from '@native/db/types';

interface AgentRow {
  id: string;
  name: string;
  slug: string;
  command: string;
  default_config_dir: string;
  config_env_var: string;
  args: string;
  resume_args: string;
  skip_permissions_args: string;
  builtin: number;
  created_at: string;
}

function toAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    command: row.command,
    defaultConfigDir: row.default_config_dir,
    configEnvVar: row.config_env_var,
    args: JSON.parse(row.args),
    resumeArgs: JSON.parse(row.resume_args),
    skipPermissionsArgs: JSON.parse(row.skip_permissions_args),
    builtin: row.builtin === 1,
    createdAt: row.created_at
  };
}

export function getAll(): Agent[] {
  const rows = getDb().prepare('SELECT * FROM agents ORDER BY created_at').all() as AgentRow[];
  return rows.map(toAgent);
}

export function getBySlug(slug: string): Agent | null {
  const row = getDb().prepare('SELECT * FROM agents WHERE slug = ?').get(slug) as
    | AgentRow
    | undefined;
  return row ? toAgent(row) : null;
}

export function getById(id: string): Agent | null {
  const row = getDb().prepare('SELECT * FROM agents WHERE id = ?').get(id) as AgentRow | undefined;
  return row ? toAgent(row) : null;
}

export function create(input: CreateAgentInput): Agent {
  const row = getDb()
    .prepare(
      `INSERT INTO agents (id, name, slug, command, default_config_dir, config_env_var, args, resume_args, skip_permissions_args)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    )
    .get(
      randomUUID(),
      input.name,
      input.slug,
      input.command,
      input.defaultConfigDir ?? '',
      input.configEnvVar ?? '',
      JSON.stringify(input.args ?? []),
      JSON.stringify(input.resumeArgs ?? []),
      JSON.stringify(input.skipPermissionsArgs ?? [])
    ) as AgentRow;
  return toAgent(row);
}

export function update(id: string, input: UpdateAgentInput): Agent {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.command !== undefined) {
    fields.push('command = ?');
    values.push(input.command);
  }
  if (input.args !== undefined) {
    fields.push('args = ?');
    values.push(JSON.stringify(input.args));
  }
  if (input.resumeArgs !== undefined) {
    fields.push('resume_args = ?');
    values.push(JSON.stringify(input.resumeArgs));
  }
  if (input.skipPermissionsArgs !== undefined) {
    fields.push('skip_permissions_args = ?');
    values.push(JSON.stringify(input.skipPermissionsArgs));
  }

  if (fields.length === 0) return getById(id)!;

  values.push(id);
  const row = getDb()
    .prepare(`UPDATE agents SET ${fields.join(', ')} WHERE id = ? RETURNING *`)
    .get(...values) as AgentRow;
  return toAgent(row);
}

export function remove(id: string): void {
  getDb().prepare('DELETE FROM agents WHERE id = ? AND builtin = 0').run(id);
}

export function count(): number {
  const row = getDb().prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
  return row.count;
}
