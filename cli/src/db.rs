use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;

pub fn nex_dir() -> PathBuf {
    dirs::home_dir().unwrap().join(".nex")
}

pub fn db_path() -> PathBuf {
    nex_dir().join("nex.db")
}

pub fn open() -> Connection {
    let dir = nex_dir();
    fs::create_dir_all(&dir).unwrap();
    let conn = Connection::open(db_path()).unwrap();
    conn.execute_batch("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;")
        .unwrap();
    run_migrations(&conn);
    conn
}

fn run_migrations(conn: &Connection) {
    let version: i32 = conn
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .unwrap_or(0);

    if version >= 3 {
        return;
    }

    conn.execute_batch(
        "BEGIN;

        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            collapsed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS worktrees (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            branch TEXT NOT NULL,
            path TEXT NOT NULL,
            dot_color TEXT NOT NULL DEFAULT '#636363',
            active INTEGER NOT NULL DEFAULT 1,
            notes TEXT NOT NULL DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            worktree_id TEXT REFERENCES worktrees(id) ON DELETE SET NULL,
            name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('running','idle','done','error')),
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS agents (
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

        CREATE TABLE IF NOT EXISTS agent_accounts (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
            name TEXT NOT NULL UNIQUE,
            config_dir TEXT NOT NULL,
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS sessions (
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
        );

        PRAGMA user_version = 3;
        COMMIT;",
    )
    .unwrap();
}

pub fn auto_detect_agents(conn: &Connection) {
    let count: i32 = conn
        .query_row("SELECT COUNT(*) FROM agents", [], |r| r.get(0))
        .unwrap_or(0);
    if count > 0 {
        return;
    }

    let home = dirs::home_dir().unwrap();
    let claude_dir = home.join(".claude");

    if which::which("claude").is_ok() && claude_dir.exists() {
        let agent_id = uuid::Uuid::new_v4().to_string();
        let account_id = uuid::Uuid::new_v4().to_string();
        let config_dir = claude_dir.to_string_lossy().to_string();

        conn.execute(
            "INSERT INTO agents (id, name, slug, command, default_config_dir, config_env_var, resume_args, skip_permissions_args, builtin) VALUES (?1, 'Claude Code', 'claude-code', 'claude', ?2, 'CLAUDE_CONFIG_DIR', '[\"--resume\"]', '[\"--dangerously-skip-permissions\"]', 1)",
            rusqlite::params![agent_id, config_dir],
        ).unwrap();

        conn.execute(
            "INSERT INTO agent_accounts (id, agent_id, name, config_dir, is_default) VALUES (?1, ?2, 'default', ?3, 1)",
            rusqlite::params![account_id, agent_id, config_dir],
        ).unwrap();

        println!("  {} Auto-detected Claude Code", "✓".green());
    }
}

use colored::Colorize;
