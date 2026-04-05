import { randomUUID } from 'crypto';
import { getDb } from '@native/db/database';
import type {
  AgentAccount,
  CreateAgentAccountInput,
  UpdateAgentAccountInput
} from '@native/db/types';

interface AgentAccountRow {
  id: string;
  agent_id: string;
  name: string;
  config_dir: string;
  is_default: number;
  created_at: string;
}

function toAgentAccount(row: AgentAccountRow): AgentAccount {
  return {
    id: row.id,
    agentId: row.agent_id,
    name: row.name,
    configDir: row.config_dir,
    isDefault: row.is_default === 1,
    createdAt: row.created_at
  };
}

export function getAll(): AgentAccount[] {
  const rows = getDb()
    .prepare('SELECT * FROM agent_accounts ORDER BY created_at')
    .all() as AgentAccountRow[];
  return rows.map(toAgentAccount);
}

export function getByAgent(agentId: string): AgentAccount[] {
  const rows = getDb()
    .prepare('SELECT * FROM agent_accounts WHERE agent_id = ? ORDER BY created_at')
    .all(agentId) as AgentAccountRow[];
  return rows.map(toAgentAccount);
}

export function getDefault(agentId: string): AgentAccount | null {
  const row = getDb()
    .prepare('SELECT * FROM agent_accounts WHERE agent_id = ? AND is_default = 1')
    .get(agentId) as AgentAccountRow | undefined;
  return row ? toAgentAccount(row) : null;
}

export function getByName(name: string): AgentAccount | null {
  const row = getDb().prepare('SELECT * FROM agent_accounts WHERE name = ?').get(name) as
    | AgentAccountRow
    | undefined;
  return row ? toAgentAccount(row) : null;
}

export function create(input: CreateAgentAccountInput): AgentAccount {
  const db = getDb();

  if (input.isDefault) {
    db.prepare('UPDATE agent_accounts SET is_default = 0 WHERE agent_id = ?').run(input.agentId);
  }

  const row = db
    .prepare(
      `INSERT INTO agent_accounts (id, agent_id, name, config_dir, is_default)
       VALUES (?, ?, ?, ?, ?) RETURNING *`
    )
    .get(
      randomUUID(),
      input.agentId,
      input.name,
      input.configDir,
      input.isDefault ? 1 : 0
    ) as AgentAccountRow;
  return toAgentAccount(row);
}

export function update(id: string, input: UpdateAgentAccountInput): AgentAccount {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.isDefault !== undefined && input.isDefault) {
    const current = getDb().prepare('SELECT agent_id FROM agent_accounts WHERE id = ?').get(id) as {
      agent_id: string;
    };
    getDb()
      .prepare('UPDATE agent_accounts SET is_default = 0 WHERE agent_id = ?')
      .run(current.agent_id);
    fields.push('is_default = 1');
  }
  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.configDir !== undefined) {
    fields.push('config_dir = ?');
    values.push(input.configDir);
  }

  if (fields.length === 0) {
    const row = getDb()
      .prepare('SELECT * FROM agent_accounts WHERE id = ?')
      .get(id) as AgentAccountRow;
    return toAgentAccount(row);
  }

  values.push(id);
  const row = getDb()
    .prepare(`UPDATE agent_accounts SET ${fields.join(', ')} WHERE id = ? RETURNING *`)
    .get(...values) as AgentAccountRow;
  return toAgentAccount(row);
}

export function remove(id: string): void {
  getDb().prepare('DELETE FROM agent_accounts WHERE id = ?').run(id);
}
