import type Database from 'better-sqlite3';

const migrations: string[] = [
  `CREATE TABLE workspaces (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    collapsed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE projects (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`,

  `CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,

  `CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    command TEXT NOT NULL,
    default_config_dir TEXT NOT NULL DEFAULT '',
    config_env_var TEXT NOT NULL DEFAULT '',
    args TEXT NOT NULL DEFAULT '[]',
    resume_args TEXT NOT NULL DEFAULT '[]',
    skip_permissions_args TEXT NOT NULL DEFAULT '[]',
    builtin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE agent_accounts (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL UNIQUE,
    config_dir TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    account_id TEXT REFERENCES agent_accounts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    branch TEXT NOT NULL,
    base_branch TEXT NOT NULL,
    worktree_path TEXT NOT NULL,
    notes_path TEXT NOT NULL DEFAULT '',
    symlinks TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','done','pr')),
    opens INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_opened TEXT NOT NULL DEFAULT (datetime('now'))
  );`,

  `ALTER TABLE workspaces ADD COLUMN icon TEXT NOT NULL DEFAULT 'letter';
  ALTER TABLE workspaces ADD COLUMN custom_image TEXT;
  ALTER TABLE projects ADD COLUMN quick_commands TEXT NOT NULL DEFAULT '[]';`,

  `ALTER TABLE projects ADD COLUMN branch_prefix TEXT NOT NULL DEFAULT '';`,

  `ALTER TABLE workspaces ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;`,

  `ALTER TABLE sessions ADD COLUMN diff_visible INTEGER NOT NULL DEFAULT 1;
  ALTER TABLE sessions ADD COLUMN notes_visible INTEGER NOT NULL DEFAULT 1;
  ALTER TABLE sessions ADD COLUMN vertical_layout TEXT;
  ALTER TABLE sessions ADD COLUMN horizontal_layout TEXT;
  DELETE FROM settings WHERE key = 'session-ui';`,

  `ALTER TABLE sessions ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;`,

  `CREATE TABLE terminals (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    command TEXT,
    args TEXT NOT NULL DEFAULT '[]',
    cwd TEXT NOT NULL,
    env TEXT NOT NULL DEFAULT '{}',
    is_primary INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX idx_terminals_session ON terminals(session_id);`,

  `ALTER TABLE terminals ADD COLUMN status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle','running'));`,

  `ALTER TABLE terminals ADD COLUMN type TEXT NOT NULL DEFAULT 'shell' CHECK(type IN ('agent','shell'));`,

  `UPDATE terminals SET type = 'agent' WHERE is_primary = 1 AND command IS NOT NULL;
   UPDATE terminals SET name = 'Claude Code'
     WHERE id IN (
       SELECT t.id FROM terminals t
       JOIN sessions s ON s.id = t.session_id
       JOIN agents a ON a.id = s.agent_id
       WHERE t.is_primary = 1 AND a.slug = 'claude-code'
     );`,

  `ALTER TABLE terminals ADD COLUMN run_command TEXT;`,

  `ALTER TABLE sessions ADD COLUMN width INTEGER NOT NULL DEFAULT 600;`,

  `ALTER TABLE terminals ADD COLUMN agent_session_id TEXT;`,

  // SQLite can't widen a CHECK constraint in place, so the table is rebuilt to admit 'waiting'.
  `CREATE TABLE terminals_new (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    command TEXT,
    args TEXT NOT NULL DEFAULT '[]',
    cwd TEXT NOT NULL,
    env TEXT NOT NULL DEFAULT '{}',
    is_primary INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle','running','waiting')),
    type TEXT NOT NULL DEFAULT 'shell' CHECK(type IN ('agent','shell')),
    run_command TEXT,
    agent_session_id TEXT
  );

  INSERT INTO terminals_new
    (id, session_id, name, command, args, cwd, env, is_primary, sort_order, created_at, status, type, run_command, agent_session_id)
  SELECT
    id, session_id, name, command, args, cwd, env, is_primary, sort_order, created_at, status, type, run_command, agent_session_id
  FROM terminals;

  DROP TABLE terminals;
  ALTER TABLE terminals_new RENAME TO terminals;
  CREATE INDEX idx_terminals_session ON terminals(session_id);`,

  // Claude Code prunes its own transcripts after `cleanupPeriodDays`, so usage is
  // mirrored here at ingest to keep history the CLI no longer has.
  `ALTER TABLE agent_accounts ADD COLUMN keychain_service TEXT;

  CREATE TABLE usage_events (
    key TEXT PRIMARY KEY,
    account_id TEXT REFERENCES agent_accounts(id) ON DELETE SET NULL,
    agent_session_id TEXT NOT NULL DEFAULT '',
    cwd TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL,
    speed TEXT NOT NULL DEFAULT 'standard',
    ts TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cache_write_5m INTEGER NOT NULL DEFAULT 0,
    cache_write_1h INTEGER NOT NULL DEFAULT 0,
    cache_read INTEGER NOT NULL DEFAULT 0,
    web_searches INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX idx_usage_events_ts ON usage_events(ts);
  CREATE INDEX idx_usage_events_session ON usage_events(agent_session_id);
  CREATE INDEX idx_usage_events_account_ts ON usage_events(account_id, ts);

  CREATE TABLE usage_scan (
    file_path TEXT PRIMARY KEY,
    account_id TEXT,
    size INTEGER NOT NULL DEFAULT 0,
    byte_offset INTEGER NOT NULL DEFAULT 0,
    scanned_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`
];

export function runMigrations(db: Database.Database): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number;

  if (currentVersion >= migrations.length) return;

  const migrate = db.transaction(() => {
    for (let i = currentVersion; i < migrations.length; i++) {
      db.exec(migrations[i]);
    }
    db.pragma(`user_version = ${migrations.length}`);
  });

  migrate();
}
