import { randomUUID } from "crypto";
import { getDb } from "@native/db/database";
import type {
  Project,
  CreateProjectInput,
  ProjectSetup,
  UpdateProjectInput,
} from "@native/db/types";

interface ProjectRow {
  id: string;
  workspace_id: string;
  name: string;
  path: string;
  branch_prefix: string;
  base_branch: string;
  pull_base: number;
  setup: string | null;
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
    branchPrefix: row.branch_prefix,
    baseBranch: row.base_branch,
    pullBase: row.pull_base === 1,
    setup: row.setup ? (JSON.parse(row.setup) as ProjectSetup) : null,
    quickCommands: JSON.parse(row.quick_commands),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function getById(id: string): Project | null {
  const row = getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | ProjectRow
    | undefined;
  return row ? toProject(row) : null;
}

export function getAll(): Project[] {
  const rows = getDb().prepare("SELECT * FROM projects ORDER BY sort_order").all() as ProjectRow[];
  return rows.map(toProject);
}

export function getByWorkspace(workspaceId: string): Project[] {
  const rows = getDb()
    .prepare("SELECT * FROM projects WHERE workspace_id = ? ORDER BY sort_order")
    .all(workspaceId) as ProjectRow[];
  return rows.map(toProject);
}

export function create(input: CreateProjectInput): Project {
  const db = getDb();
  const maxOrder = db
    .prepare(
      "SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM projects WHERE workspace_id = ?",
    )
    .get(input.workspaceId) as { next: number };
  const row = db
    .prepare(
      "INSERT INTO projects (id, workspace_id, name, path, branch_prefix, base_branch, pull_base, setup, quick_commands, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
    )
    .get(
      randomUUID(),
      input.workspaceId,
      input.name,
      input.path,
      input.branchPrefix ?? "",
      input.baseBranch ?? "",
      input.pullBase === false ? 0 : 1,
      input.setup ? JSON.stringify(input.setup) : null,
      JSON.stringify(input.quickCommands ?? []),
      maxOrder.next,
    ) as ProjectRow;
  return toProject(row);
}

export function update(id: string, input: UpdateProjectInput): Project {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    fields.push("name = ?");
    values.push(input.name);
  }
  if (input.path !== undefined) {
    fields.push("path = ?");
    values.push(input.path);
  }
  if (input.branchPrefix !== undefined) {
    fields.push("branch_prefix = ?");
    values.push(input.branchPrefix);
  }
  if (input.baseBranch !== undefined) {
    fields.push("base_branch = ?");
    values.push(input.baseBranch);
  }
  if (input.pullBase !== undefined) {
    fields.push("pull_base = ?");
    values.push(input.pullBase ? 1 : 0);
  }
  if (input.setup !== undefined) {
    fields.push("setup = ?");
    values.push(input.setup ? JSON.stringify(input.setup) : null);
  }
  if (input.quickCommands !== undefined) {
    fields.push("quick_commands = ?");
    values.push(JSON.stringify(input.quickCommands));
  }
  if (input.sortOrder !== undefined) {
    fields.push("sort_order = ?");
    values.push(input.sortOrder);
  }

  if (fields.length === 0) {
    const row = getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow;
    return toProject(row);
  }

  values.push(id);
  const row = getDb()
    .prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ? RETURNING *`)
    .get(...values) as ProjectRow;
  return toProject(row);
}

export function remove(id: string): void {
  getDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
}
