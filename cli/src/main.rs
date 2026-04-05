mod context;
mod db;
mod git;
mod symlinks;

use clap::{Parser, Subcommand};
use colored::Colorize;
use rusqlite::params;
use serde::Serialize;
use std::io::{self, Write};
use std::path::Path;
use std::{env, fs, process};

#[derive(Parser)]
#[command(name = "nex", about = "worktree & agent manager")]
struct Cli {
    /// Output as JSON (for GUI integration)
    #[arg(long, global = true)]
    json: bool,

    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Launch agent in a new worktree
    #[command(trailing_var_arg = true, allow_hyphen_values = true)]
    Work { args: Vec<String> },
    /// Resume an existing session
    #[command(trailing_var_arg = true, allow_hyphen_values = true)]
    Resume { args: Vec<String> },
    /// Manage workspaces
    Workspace {
        #[command(subcommand)]
        sub: WorkspaceSub,
    },
    /// Manage Claude accounts
    Account {
        #[command(subcommand)]
        sub: AccountSub,
    },
    /// Manage projects
    Project {
        #[command(subcommand)]
        sub: ProjectSub,
    },
    /// Manage worktrees
    Worktree {
        #[command(subcommand)]
        sub: WorktreeSub,
    },
    /// Overview of all projects and sessions
    Status,
    /// Health check
    Doctor,
}

#[derive(Subcommand)]
enum WorkspaceSub {
    Create { name: String },
    List,
    Remove { name: String },
}

#[derive(Subcommand)]
enum AccountSub {
    Add {
        name: String,
        #[arg(long)]
        copy_config: bool,
    },
    List,
    Remove { name: String },
    Default { name: String },
}

#[derive(Subcommand)]
enum ProjectSub {
    Register {
        path: Option<String>,
        #[arg(long)]
        workspace: Option<String>,
    },
    List {
        #[arg(long)]
        workspace: Option<String>,
    },
    Info { name: Option<String> },
    Remove { name: Option<String> },
}

#[derive(Subcommand)]
enum WorktreeSub {
    List { project: Option<String> },
    Status { task: Option<String> },
    Push { task: Option<String> },
    Pr {
        task: Option<String>,
        #[arg(long)]
        title: Option<String>,
    },
    Remove { task: Option<String> },
}

// ─── JSON output types ───

#[derive(Serialize)]
struct JsonResult<T: Serialize> {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

fn json_ok<T: Serialize>(data: T) {
    println!(
        "{}",
        serde_json::to_string(&JsonResult {
            ok: true,
            data: Some(data),
            error: None
        })
        .unwrap()
    );
}

fn json_err(msg: &str) {
    println!(
        "{}",
        serde_json::to_string(&JsonResult::<()> {
            ok: false,
            data: None,
            error: Some(msg.to_string())
        })
        .unwrap()
    );
}

// ─── Human output helpers ───

fn log(msg: &str) {
    println!("  {} {msg}", "✓".green());
}
fn warn(msg: &str) {
    println!("  {} {msg}", "⚠".yellow());
}
fn err(msg: &str) {
    eprintln!("  {} {msg}", "✗".red());
}
fn dim(msg: &str) {
    println!("  {}", msg.dimmed());
}
fn uid() -> String {
    uuid::Uuid::new_v4().to_string()
}

fn main() {
    let conn = db::open();
    db::auto_detect_agents(&conn);
    let cli = Cli::parse();
    let json = cli.json;

    match cli.command {
        Some(Commands::Work { args }) => cmd_work(&conn, &args, json),
        Some(Commands::Resume { args }) => cmd_resume(&conn, &args, json),
        Some(Commands::Workspace { sub }) => cmd_workspace(&conn, sub, json),
        Some(Commands::Account { sub }) => cmd_account(&conn, sub, json),
        Some(Commands::Project { sub }) => cmd_project(&conn, sub, json),
        Some(Commands::Worktree { sub }) => cmd_worktree(&conn, sub, json),
        Some(Commands::Status) => cmd_status(&conn, json),
        Some(Commands::Doctor) => cmd_doctor(&conn, json),
        None => {
            Cli::parse_from(["nex", "--help"]);
        }
    }
}

// ─── Workspace ───

#[derive(Serialize)]
struct WorkspaceOut {
    id: String,
    name: String,
    color: String,
    project_count: i32,
}

fn cmd_workspace(conn: &rusqlite::Connection, sub: WorkspaceSub, json: bool) {
    match sub {
        WorkspaceSub::Create { name } => {
            let id = uid();
            conn.execute(
                "INSERT INTO workspaces (id, name, color) VALUES (?1, ?2, '#636363')",
                params![id, name],
            )
            .unwrap();
            if json {
                json_ok(serde_json::json!({"id": id, "name": name}));
            } else {
                log(&format!("Created workspace '{name}'"));
            }
        }
        WorkspaceSub::List => {
            let mut stmt = conn.prepare("SELECT w.id, w.name, w.color, (SELECT COUNT(*) FROM projects WHERE workspace_id = w.id) FROM workspaces w ORDER BY sort_order").unwrap();
            let rows: Vec<WorkspaceOut> = stmt
                .query_map([], |r| {
                    Ok(WorkspaceOut {
                        id: r.get(0)?,
                        name: r.get(1)?,
                        color: r.get(2)?,
                        project_count: r.get(3)?,
                    })
                })
                .unwrap()
                .filter_map(|r| r.ok())
                .collect();
            if json {
                json_ok(&rows);
            } else {
                println!("\n  {}", "WORKSPACES".bold());
                if rows.is_empty() {
                    dim("No workspaces yet. Create one with: nex workspace create <name>");
                } else {
                    for w in &rows {
                        println!("  {:20} {} projects", w.name, w.project_count);
                    }
                }
                println!();
            }
        }
        WorkspaceSub::Remove { name } => {
            conn.execute("DELETE FROM workspaces WHERE name = ?1", params![name])
                .unwrap();
            if json {
                json_ok(serde_json::json!({"removed": name}));
            } else {
                log(&format!("Removed workspace '{name}'"));
            }
        }
    }
}

// ─── Account ───

#[derive(Serialize)]
struct AccountOut {
    id: String,
    name: String,
    agent_name: String,
    config_dir: String,
    is_default: bool,
    authenticated: bool,
}

fn cmd_account(conn: &rusqlite::Connection, sub: AccountSub, json: bool) {
    match sub {
        AccountSub::Add { name, copy_config } => {
            let agent_id: String = conn
                .query_row("SELECT id FROM agents WHERE slug = 'claude-code'", [], |r| r.get(0))
                .unwrap_or_else(|_| {
                    if json { json_err("Claude Code agent not found"); } else { err("Claude Code agent not found. Is claude installed?"); }
                    process::exit(1);
                });

            let acct_dir = db::nex_dir().join("accounts").join(&name);
            fs::create_dir_all(&acct_dir).unwrap();

            if copy_config {
                let default_dir: String = conn
                    .query_row("SELECT default_config_dir FROM agents WHERE id = ?1", params![agent_id], |r| r.get(0))
                    .unwrap_or_default();
                let src = Path::new(&default_dir);
                if src.is_dir() {
                    for f in &["settings.json"] {
                        let s = src.join(f);
                        if s.exists() { let _ = fs::copy(&s, acct_dir.join(f)); }
                    }
                    for d in &["commands", "skills", "agents"] {
                        let s = src.join(d);
                        if s.is_dir() { copy_dir_recursive(&s, &acct_dir.join(d)); }
                    }
                    let claude_md = dirs::home_dir().unwrap().join("CLAUDE.md");
                    if claude_md.exists() { let _ = fs::copy(&claude_md, acct_dir.join("CLAUDE.md")); }
                    if !json { log(&format!("Copied config from {default_dir}")); }
                }
            }

            let id = uid();
            let acct_str = acct_dir.to_string_lossy().to_string();
            conn.execute(
                "INSERT INTO agent_accounts (id, agent_id, name, config_dir, is_default) VALUES (?1, ?2, ?3, ?4, 0)",
                params![id, agent_id, name, acct_str],
            ).unwrap();

            if json {
                json_ok(serde_json::json!({"id": id, "name": name, "config_dir": acct_str}));
            } else {
                log(&format!("Created account '{name}' at {acct_str}"));
                println!();
                dim("Authenticate by running:");
                println!("    {}", format!("CLAUDE_CONFIG_DIR={acct_str} claude /login").bold());
                println!();
            }
        }
        AccountSub::List => {
            let mut stmt = conn.prepare("SELECT aa.id, aa.name, a.name, aa.config_dir, aa.is_default FROM agent_accounts aa JOIN agents a ON aa.agent_id = a.id ORDER BY aa.created_at").unwrap();
            let rows: Vec<AccountOut> = stmt
                .query_map([], |r| {
                    let config_dir: String = r.get(3)?;
                    let auth = Path::new(&config_dir).join(".claude.json").exists();
                    Ok(AccountOut {
                        id: r.get(0)?,
                        name: r.get(1)?,
                        agent_name: r.get(2)?,
                        config_dir,
                        is_default: r.get::<_, i32>(4)? == 1,
                        authenticated: auth,
                    })
                })
                .unwrap()
                .filter_map(|r| r.ok())
                .collect();
            if json {
                json_ok(&rows);
            } else {
                println!("\n  {}", "ACCOUNTS".bold());
                if rows.is_empty() {
                    dim("No accounts. Claude will be auto-detected on first use.");
                } else {
                    for a in &rows {
                        let auth = if a.authenticated { "✓ auth".green().to_string() } else { "✗ no auth".red().to_string() };
                        let tag = if a.is_default { " (default)".yellow().to_string() } else { String::new() };
                        println!("  {:15} {:15} {auth}{tag}", a.name, a.agent_name);
                    }
                }
                println!();
            }
        }
        AccountSub::Remove { name } => {
            if name == "default" {
                if json { json_err("Cannot remove the default account"); } else { err("Cannot remove the default account"); }
                process::exit(1);
            }
            conn.execute("DELETE FROM agent_accounts WHERE name = ?1", params![name]).unwrap();
            if json { json_ok(serde_json::json!({"removed": name})); } else { log(&format!("Removed account '{name}'")); }
        }
        AccountSub::Default { name } => {
            let agent_id: String = conn
                .query_row("SELECT agent_id FROM agent_accounts WHERE name = ?1", params![name], |r| r.get(0))
                .unwrap_or_else(|_| {
                    if json { json_err(&format!("Account '{name}' not found")); } else { err(&format!("Account '{name}' not found")); }
                    process::exit(1);
                });
            conn.execute("UPDATE agent_accounts SET is_default = 0 WHERE agent_id = ?1", params![agent_id]).unwrap();
            conn.execute("UPDATE agent_accounts SET is_default = 1 WHERE name = ?1", params![name]).unwrap();
            if json { json_ok(serde_json::json!({"default": name})); } else { log(&format!("Default account set to '{name}'")); }
        }
    }
}

// ─── Project ───

#[derive(Serialize)]
struct ProjectOut {
    id: String,
    name: String,
    path: String,
    workspace: String,
}

fn cmd_project(conn: &rusqlite::Connection, sub: ProjectSub, json: bool) {
    match sub {
        ProjectSub::Register { path, workspace } => {
            let path = path
                .map(|p| fs::canonicalize(&p).unwrap_or_else(|_| { if json { json_err(&format!("Path not found: {p}")); } else { err(&format!("Path not found: {p}")); } process::exit(1); }).to_string_lossy().to_string())
                .unwrap_or_else(|| env::current_dir().unwrap().to_string_lossy().to_string());

            if !git::is_git_repo(&path) {
                if json { json_err(&format!("Not a git repository: {path}")); } else { err(&format!("Not a git repository: {path}")); }
                process::exit(1);
            }

            let name = Path::new(&path).file_name().unwrap().to_string_lossy().to_string();

            let ws_name = workspace.unwrap_or_else(|| {
                let count: i32 = conn.query_row("SELECT COUNT(*) FROM workspaces", [], |r| r.get(0)).unwrap();
                if count == 0 {
                    if json { json_err("No workspaces found"); } else { err("No workspaces found. Create one first: nex workspace create <name>"); }
                    process::exit(1);
                } else if count == 1 {
                    conn.query_row("SELECT name FROM workspaces LIMIT 1", [], |r| r.get(0)).unwrap()
                } else {
                    if json { json_err("Multiple workspaces. Specify with --workspace"); } else { err("Multiple workspaces. Specify with --workspace <name>"); }
                    process::exit(1);
                }
            });

            let ws_id: String = conn
                .query_row("SELECT id FROM workspaces WHERE name = ?1", params![ws_name], |r| r.get(0))
                .unwrap_or_else(|_| { if json { json_err(&format!("Workspace '{ws_name}' not found")); } else { err(&format!("Workspace '{ws_name}' not found")); } process::exit(1); });

            let id = uid();
            conn.execute("INSERT INTO projects (id, workspace_id, name, path) VALUES (?1, ?2, ?3, ?4)", params![id, ws_id, name, path]).unwrap();
            if json {
                json_ok(serde_json::json!({"id": id, "name": name, "path": path, "workspace": ws_name}));
            } else {
                log(&format!("Registered '{name}' at {path} (workspace: {ws_name})"));
            }
        }
        ProjectSub::List { workspace } => {
            let sql = if let Some(ref ws) = workspace {
                format!("SELECT p.id, p.name, p.path, w.name FROM projects p JOIN workspaces w ON p.workspace_id = w.id WHERE w.name = '{ws}' ORDER BY w.sort_order, p.sort_order")
            } else {
                "SELECT p.id, p.name, p.path, w.name FROM projects p JOIN workspaces w ON p.workspace_id = w.id ORDER BY w.sort_order, p.sort_order".to_string()
            };
            let mut stmt = conn.prepare(&sql).unwrap();
            let rows: Vec<ProjectOut> = stmt
                .query_map([], |r| Ok(ProjectOut { id: r.get(0)?, name: r.get(1)?, path: r.get(2)?, workspace: r.get(3)? }))
                .unwrap().filter_map(|r| r.ok()).collect();
            if json {
                json_ok(&rows);
            } else {
                println!("\n  {}", "PROJECTS".bold());
                if rows.is_empty() { dim("No projects. Register with: nex project register [path]"); } else {
                    for p in &rows { println!("  {:20} {:15} {}", p.name, p.workspace, p.path); }
                }
                println!();
            }
        }
        ProjectSub::Info { name } => {
            let name = name.or_else(|| context::detect_project(conn)).unwrap_or_else(|| { if json { json_err("No project specified"); } else { err("Usage: nex project info <name>"); } process::exit(1); });
            let row: Result<(String, String, String), _> = conn.query_row(
                "SELECT p.path, w.name, p.id FROM projects p JOIN workspaces w ON p.workspace_id = w.id WHERE p.name = ?1",
                params![name], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            );
            match row {
                Ok((path, ws, id)) => {
                    let mut stmt = conn.prepare("SELECT s.name, s.branch, s.status FROM sessions s WHERE s.project_id = ?1 ORDER BY s.last_opened DESC").unwrap();
                    let sessions: Vec<(String, String, String)> = stmt
                        .query_map(params![id], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
                        .unwrap().filter_map(|r| r.ok()).collect();
                    if json {
                        json_ok(serde_json::json!({"name": name, "path": path, "workspace": ws, "sessions": sessions.iter().map(|(n,b,s)| serde_json::json!({"name":n,"branch":b,"status":s})).collect::<Vec<_>>()}));
                    } else {
                        println!("\n  {}", name.bold());
                        println!("  Path:      {path}");
                        println!("  Workspace: {ws}");
                        if !sessions.is_empty() {
                            println!("\n  {}", "Sessions:".bold());
                            for (sn, br, st) in &sessions {
                                let icon = if st == "active" { "●" } else { "○" };
                                println!("    {icon} {sn:20} {br:30} {st}");
                            }
                        }
                        println!();
                    }
                }
                Err(_) => { if json { json_err(&format!("Project '{name}' not found")); } else { err(&format!("Project '{name}' not found")); } process::exit(1); }
            }
        }
        ProjectSub::Remove { name } => {
            let name = name.or_else(|| context::detect_project(conn)).unwrap_or_else(|| { if json { json_err("No project specified"); } else { err("Usage: nex project remove <name>"); } process::exit(1); });
            conn.execute("DELETE FROM projects WHERE name = ?1", params![name]).unwrap();
            if json { json_ok(serde_json::json!({"removed": name})); } else { log(&format!("Removed project '{name}'")); }
        }
    }
}

// ─── Work ───

#[derive(Serialize)]
struct WorkOut {
    session_id: String,
    project: String,
    task: String,
    branch: String,
    worktree_path: String,
    account: String,
    base_branch: String,
}

fn cmd_work(conn: &rusqlite::Connection, args: &[String], json: bool) {
    let mut project: Option<String> = None;
    let mut task: Option<String> = None;
    let mut account: Option<String> = None;
    let mut base: Option<String> = None;
    let mut symlink_items: Vec<String> = Vec::new();

    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--account" => { account = Some(args[i + 1].clone()); i += 2; }
            "--base" => { base = Some(args[i + 1].clone()); i += 2; }
            "--symlink" => { symlink_items.push(args[i + 1].clone()); i += 2; }
            a if a.starts_with('-') => { i += 1; }
            _ => {
                if task.is_none() {
                    let is_proj: bool = conn.query_row("SELECT COUNT(*) FROM projects WHERE name = ?1", params![args[i]], |r| r.get::<_, i32>(0)).unwrap_or(0) > 0;
                    if is_proj && project.is_none() { project = Some(args[i].clone()); } else { task = Some(args[i].clone()); }
                }
                i += 1;
            }
        }
    }

    let task = task.unwrap_or_else(|| {
        if json { json_err("Missing task name"); } else { err("Usage: nex work [project] <task> [--account name] [--base branch] [--symlink item]"); }
        process::exit(1);
    });

    let project = context::require_project(conn, project.as_deref()).unwrap_or_else(|e| { if json { json_err(&e); } else { err(&e); } process::exit(1); });
    let (project_id, project_path): (String, String) = conn
        .query_row("SELECT id, path FROM projects WHERE name = ?1", params![project], |r| Ok((r.get(0)?, r.get(1)?)))
        .unwrap_or_else(|_| { if json { json_err(&format!("Project '{project}' not found")); } else { err(&format!("Project '{project}' not found")); } process::exit(1); });

    // Existing session?
    let existing: Option<String> = conn
        .query_row("SELECT id FROM sessions WHERE name = ?1 AND project_id = ?2 AND status = 'active'", params![task, project_id], |r| r.get(0))
        .ok();

    if existing.is_some() {
        if json {
            json_ok(serde_json::json!({"existing_session": true, "task": task, "project": project}));
            return;
        }
        print!("  Session {} already exists. Resume? [Y/n] ", task.bold());
        io::stdout().flush().unwrap();
        let mut answer = String::new();
        io::stdin().read_line(&mut answer).unwrap();
        if answer.trim().is_empty() || answer.trim().to_lowercase().starts_with('y') {
            cmd_resume(conn, &[project.clone(), task.clone()], false);
            return;
        }
        dim("Aborted");
        return;
    }

    let account_name = account.unwrap_or_else(|| {
        conn.query_row("SELECT name FROM agent_accounts WHERE is_default = 1 LIMIT 1", [], |r| r.get(0))
            .unwrap_or_else(|_| { if json { json_err("No default account"); } else { err("No default account. Add one: nex account add <name>"); } process::exit(1); })
    });

    let (account_id, config_dir, agent_cmd, config_env_var, skip_args, agent_id): (String, String, String, String, String, String) = conn
        .query_row(
            "SELECT aa.id, aa.config_dir, a.command, a.config_env_var, a.skip_permissions_args, a.id FROM agent_accounts aa JOIN agents a ON aa.agent_id = a.id WHERE aa.name = ?1",
            params![account_name], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?, r.get(5)?)),
        )
        .unwrap_or_else(|_| { if json { json_err(&format!("Account '{account_name}' not found")); } else { err(&format!("Account '{account_name}' not found")); } process::exit(1); });

    let base = base.unwrap_or_else(|| git::detect_base_branch(&project_path));
    let prefix: String = conn.query_row("SELECT value FROM settings WHERE key = 'branch_prefix'", [], |r| r.get(0)).unwrap_or_else(|_| "task".to_string());
    let branch_name = format!("{prefix}/{task}");
    let wt_path = format!("{project_path}/.worktrees/{task}");

    if !json {
        dim(&format!("Project:  {project}"));
        dim(&format!("Task:     {task}"));
        dim(&format!("Account:  {account_name}"));
        dim(&format!("Base:     {base}"));
        dim(&format!("Branch:   {branch_name}"));
        println!();
        dim("Fetching origin...");
    }

    git::fetch_origin(&project_path);

    if let Err(e) = git::create_worktree(&project_path, &branch_name, &wt_path, &base) {
        if json { json_err(&format!("Failed to create worktree: {e}")); } else { err(&format!("Failed to create worktree: {e}")); }
        process::exit(1);
    }
    if !json { log("Created worktree"); }

    git::setup_git_exclude(&project_path);

    if !symlink_items.is_empty() {
        symlinks::setup(&project_path, &wt_path, &symlink_items);
        if !json { log("Created symlinks"); }
    }

    let symlinks_json = serde_json_mini(&symlink_items);

    let sessions_dir = db::nex_dir().join("sessions").join(&project).join(&task);
    fs::create_dir_all(&sessions_dir).unwrap();
    let notes_path = sessions_dir.join("TASK_NOTES.md");
    if !notes_path.exists() { fs::write(&notes_path, format!("# {task}\n\n## Notes\n")).unwrap(); }
    let _ = std::os::unix::fs::symlink(&notes_path, format!("{wt_path}/TASK_NOTES.md"));

    let shared_ctx = db::nex_dir().join("sessions").join(&project).join("SHARED_CONTEXT.md");
    if !shared_ctx.exists() { fs::write(&shared_ctx, format!("# {project} - Shared Context\n")).unwrap(); }
    let _ = std::os::unix::fs::symlink(&shared_ctx, format!("{wt_path}/SHARED_CONTEXT.md"));

    let session_id = uid();
    let notes_str = notes_path.to_string_lossy().to_string();
    conn.execute(
        "INSERT INTO sessions (id, project_id, agent_id, account_id, name, branch, base_branch, worktree_path, notes_path, symlinks) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        params![session_id, project_id, agent_id, account_id, task, branch_name, base, wt_path, notes_str, symlinks_json],
    ).unwrap();

    if json {
        json_ok(WorkOut {
            session_id: session_id.clone(),
            project: project.clone(),
            task: task.clone(),
            branch: branch_name.clone(),
            worktree_path: wt_path.clone(),
            account: account_name,
            base_branch: base,
        });
        return;
    }

    log("Session created");
    println!();
    log(&format!("Launching {agent_cmd} in .worktrees/{task}"));
    println!();

    let mut cmd = process::Command::new(&agent_cmd);
    cmd.current_dir(&wt_path);
    cmd.env("NEX_PROJECT", &project);
    cmd.env("NEX_TASK", &task);
    cmd.env("NEX_SESSION", &session_id);
    if !config_env_var.is_empty() && !config_dir.is_empty() { cmd.env(&config_env_var, &config_dir); }

    let skip_perms: String = conn.query_row("SELECT value FROM settings WHERE key = 'skip_permissions'", [], |r| r.get(0)).unwrap_or_default();
    if skip_perms == "true" { for arg in parse_json_array(&skip_args) { cmd.arg(arg); } }

    let status = cmd.status().unwrap_or_else(|e| { err(&format!("Failed to launch {agent_cmd}: {e}")); process::exit(1); });
    process::exit(status.code().unwrap_or(1));
}

// ─── Resume ───

fn cmd_resume(conn: &rusqlite::Connection, args: &[String], json: bool) {
    let mut project: Option<String> = None;
    let mut task: Option<String> = None;
    for arg in args {
        if arg.starts_with('-') { continue; }
        if task.is_none() {
            let is_proj: bool = conn.query_row("SELECT COUNT(*) FROM projects WHERE name = ?1", params![arg], |r| r.get::<_, i32>(0)).unwrap_or(0) > 0;
            if is_proj && project.is_none() { project = Some(arg.clone()); } else { task = Some(arg.clone()); }
        }
    }

    if task.is_none() { task = context::detect_task(); }
    let task = task.unwrap_or_else(|| { if json { json_err("Missing task name"); } else { err("Usage: nex resume [project] <task>"); } process::exit(1); });
    let project = context::require_project(conn, project.as_deref()).unwrap_or_else(|e| { if json { json_err(&e); } else { err(&e); } process::exit(1); });
    let project_id: String = conn.query_row("SELECT id FROM projects WHERE name = ?1", params![project], |r| r.get(0))
        .unwrap_or_else(|_| { if json { json_err(&format!("Project '{project}' not found")); } else { err(&format!("Project '{project}' not found")); } process::exit(1); });

    let (session_id, wt_path, opens, config_dir, agent_cmd, config_env_var, resume_args_json): (String, String, i32, String, String, String, String) = conn
        .query_row(
            "SELECT s.id, s.worktree_path, s.opens, COALESCE(aa.config_dir,''), COALESCE(a.command,''), COALESCE(a.config_env_var,''), COALESCE(a.resume_args,'[]') FROM sessions s LEFT JOIN agent_accounts aa ON s.account_id = aa.id LEFT JOIN agents a ON s.agent_id = a.id WHERE s.name = ?1 AND s.project_id = ?2 AND s.status = 'active'",
            params![task, project_id], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?, r.get(5)?, r.get(6)?)),
        )
        .unwrap_or_else(|_| { if json { json_err(&format!("No active session '{task}'")); } else { err(&format!("No active session '{task}' for '{project}'")); } process::exit(1); });

    if !Path::new(&wt_path).is_dir() {
        if json { json_err(&format!("Worktree directory missing: {wt_path}")); } else { err(&format!("Worktree directory missing: {wt_path}")); }
        process::exit(1);
    }

    let new_opens = opens + 1;
    conn.execute("UPDATE sessions SET opens = ?1, last_opened = datetime('now') WHERE id = ?2", params![new_opens, session_id]).unwrap();

    if json {
        json_ok(serde_json::json!({"session_id": session_id, "task": task, "project": project, "worktree_path": wt_path, "opens": new_opens}));
        return;
    }

    log(&format!("Resuming {task} (session #{new_opens})"));
    println!();

    let mut cmd = process::Command::new(&agent_cmd);
    cmd.current_dir(&wt_path);
    cmd.env("NEX_PROJECT", &project);
    cmd.env("NEX_TASK", &task);
    cmd.env("NEX_SESSION", &session_id);
    if !config_env_var.is_empty() && !config_dir.is_empty() { cmd.env(&config_env_var, &config_dir); }
    for arg in parse_json_array(&resume_args_json) { cmd.arg(arg); }

    let status = cmd.status().unwrap_or_else(|e| { err(&format!("Failed to launch {agent_cmd}: {e}")); process::exit(1); });
    process::exit(status.code().unwrap_or(1));
}

// ─── Worktree ───

#[derive(Serialize)]
struct WorktreeOut {
    name: String,
    branch: String,
    status: String,
    project: String,
    worktree_path: String,
}

#[derive(Serialize)]
struct WorktreeStatusOut {
    task: String,
    branch: String,
    base_branch: String,
    ahead: String,
    behind: String,
    changed_files: String,
}

fn cmd_worktree(conn: &rusqlite::Connection, sub: WorktreeSub, json: bool) {
    match sub {
        WorktreeSub::List { project } => {
            let project = project.or_else(|| context::detect_project(conn));
            let sql = if let Some(ref p) = project {
                format!("SELECT s.name, s.branch, s.status, p.name, s.worktree_path FROM sessions s JOIN projects p ON s.project_id = p.id WHERE p.name = '{p}' AND s.status = 'active' ORDER BY s.last_opened DESC")
            } else {
                "SELECT s.name, s.branch, s.status, p.name, s.worktree_path FROM sessions s JOIN projects p ON s.project_id = p.id WHERE s.status = 'active' ORDER BY p.name, s.last_opened DESC".to_string()
            };
            let mut stmt = conn.prepare(&sql).unwrap();
            let rows: Vec<WorktreeOut> = stmt
                .query_map([], |r| Ok(WorktreeOut { name: r.get(0)?, branch: r.get(1)?, status: r.get(2)?, project: r.get(3)?, worktree_path: r.get(4)? }))
                .unwrap().filter_map(|r| r.ok()).collect();
            if json {
                json_ok(&rows);
            } else {
                println!("\n  {}", "WORKTREES".bold());
                if rows.is_empty() { dim("No active worktrees"); } else {
                    for w in &rows { println!("  {:15} {:20} {:30} {}", w.project, w.name, w.branch, w.status); }
                }
                println!();
            }
        }
        WorktreeSub::Status { task } => {
            let task = task.or_else(context::detect_task).unwrap_or_else(|| { if json { json_err("Missing task"); } else { err("Usage: nex worktree status [task]"); } process::exit(1); });
            let project = context::detect_project(conn).unwrap_or_default();
            let project_id: String = conn.query_row("SELECT id FROM projects WHERE name = ?1", params![project], |r| r.get(0)).unwrap_or_default();
            let (wt_path, branch, base_branch): (String, String, String) = conn.query_row(
                "SELECT worktree_path, branch, base_branch FROM sessions WHERE name = ?1 AND project_id = ?2 AND status = 'active'",
                params![task, project_id], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?))
            ).unwrap_or_else(|_| { if json { json_err(&format!("No active session '{task}'")); } else { err(&format!("No active session '{task}'")); } process::exit(1); });

            let (ahead, behind) = if Path::new(&wt_path).is_dir() { git::ahead_behind(&wt_path, &base_branch) } else { ("?".into(), "?".into()) };
            let changes = if Path::new(&wt_path).is_dir() { git::changed_file_count(&wt_path) } else { "?".into() };

            if json {
                json_ok(WorktreeStatusOut { task: task.clone(), branch, base_branch, ahead, behind, changed_files: changes });
            } else {
                println!("\n  {}", task.bold());
                println!("  Branch:   {branch}");
                println!("  Base:     {base_branch}");
                println!("  Ahead:    {ahead} commits");
                println!("  Behind:   {behind} commits");
                println!("  Changed:  {changes} files");
                if Path::new(&wt_path).is_dir() && changes != "0" {
                    println!();
                    for line in git::diff_stat(&wt_path).lines().take(20) { println!("    {line}"); }
                }
                println!();
            }
        }
        WorktreeSub::Push { task } => {
            let task = task.or_else(context::detect_task).unwrap_or_else(|| { if json { json_err("Missing task"); } else { err("Usage: nex worktree push [task]"); } process::exit(1); });
            let project = context::detect_project(conn).unwrap_or_default();
            let project_id: String = conn.query_row("SELECT id FROM projects WHERE name = ?1", params![project], |r| r.get(0)).unwrap_or_default();
            let (wt_path, branch): (String, String) = conn.query_row(
                "SELECT worktree_path, branch FROM sessions WHERE name = ?1 AND project_id = ?2 AND status = 'active'",
                params![task, project_id], |r| Ok((r.get(0)?, r.get(1)?))
            ).unwrap_or_else(|_| { if json { json_err(&format!("No active session '{task}'")); } else { err(&format!("No active session '{task}'")); } process::exit(1); });
            if !json { dim(&format!("Pushing {branch}...")); }
            match git::push_branch(&wt_path, &branch) {
                Ok(()) => { if json { json_ok(serde_json::json!({"pushed": branch})); } else { log(&format!("Pushed {branch}")); } }
                Err(e) => { if json { json_err(&format!("Push failed: {e}")); } else { err(&format!("Push failed: {e}")); } process::exit(1); }
            }
        }
        WorktreeSub::Pr { task, title } => {
            if which::which("gh").is_err() { if json { json_err("gh CLI not found"); } else { err("gh CLI not found. Install: https://cli.github.com"); } process::exit(1); }
            let task = task.or_else(context::detect_task).unwrap_or_else(|| { if json { json_err("Missing task"); } else { err("Usage: nex worktree pr [task]"); } process::exit(1); });
            let project = context::detect_project(conn).unwrap_or_default();
            let project_id: String = conn.query_row("SELECT id FROM projects WHERE name = ?1", params![project], |r| r.get(0)).unwrap_or_default();
            let (session_id, wt_path, branch, base_branch): (String, String, String, String) = conn.query_row(
                "SELECT id, worktree_path, branch, base_branch FROM sessions WHERE name = ?1 AND project_id = ?2 AND status = 'active'",
                params![task, project_id], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?))
            ).unwrap_or_else(|_| { if json { json_err(&format!("No active session '{task}'")); } else { err(&format!("No active session '{task}'")); } process::exit(1); });
            let title = title.unwrap_or_else(|| task.clone());
            if !json { dim(&format!("Pushing {branch}...")); }
            let _ = git::push_branch(&wt_path, &branch);
            if !json { dim("Creating PR..."); }
            match git::create_pr(&wt_path, &base_branch, &branch, &title) {
                Ok(url) => {
                    conn.execute("UPDATE sessions SET status = 'pr' WHERE id = ?1", params![session_id]).unwrap();
                    if json { json_ok(serde_json::json!({"pr_url": url, "branch": branch})); } else { log(&format!("PR created: {url}")); }
                }
                Err(e) => { if json { json_err(&format!("PR failed: {e}")); } else { err(&format!("PR failed: {e}")); } process::exit(1); }
            }
        }
        WorktreeSub::Remove { task } => {
            let task = task.or_else(context::detect_task).unwrap_or_else(|| { if json { json_err("Missing task"); } else { err("Usage: nex worktree remove [task]"); } process::exit(1); });
            let project = context::detect_project(conn).unwrap_or_default();
            let project_id: String = conn.query_row("SELECT id FROM projects WHERE name = ?1", params![project], |r| r.get(0)).unwrap_or_default();
            let (session_id, wt_path, branch): (String, String, String) = conn.query_row(
                "SELECT id, worktree_path, branch FROM sessions WHERE name = ?1 AND project_id = ?2",
                params![task, project_id], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?))
            ).unwrap_or_else(|_| { if json { json_err(&format!("No session '{task}'")); } else { err(&format!("No session '{task}'")); } process::exit(1); });
            let project_path: String = conn.query_row("SELECT path FROM projects WHERE id = ?1", params![project_id], |r| r.get(0)).unwrap();

            if Path::new(&wt_path).is_dir() {
                let unpushed = git::unpushed_count(&wt_path, &branch);
                let uncommitted = git::uncommitted_count(&wt_path);
                if !json && (unpushed > 0 || uncommitted > 0) {
                    warn("This worktree has unpushed/uncommitted changes:");
                    if unpushed > 0 { dim(&format!("  {unpushed} unpushed commits")); }
                    if uncommitted > 0 { dim(&format!("  {uncommitted} uncommitted files")); }
                    print!("  Continue? [y/N] ");
                    io::stdout().flush().unwrap();
                    let mut answer = String::new();
                    io::stdin().read_line(&mut answer).unwrap();
                    if !answer.trim().to_lowercase().starts_with('y') { dim("Aborted"); return; }
                }
                let _ = git::remove_worktree(&project_path, &wt_path);
                if !json { log("Removed worktree"); }
            }
            if git::delete_branch(&project_path, &branch) && !json { log(&format!("Deleted branch {branch}")); }
            conn.execute("UPDATE sessions SET status = 'done' WHERE id = ?1", params![session_id]).unwrap();
            if json { json_ok(serde_json::json!({"removed": task, "session_id": session_id})); } else { log(&format!("Session '{task}' closed")); }
        }
    }
}

// ─── Status ───

fn cmd_status(conn: &rusqlite::Connection, json: bool) {
    let project = context::detect_project(conn);
    let agents: i32 = conn.query_row("SELECT COUNT(*) FROM agents", [], |r| r.get(0)).unwrap_or(0);
    let accounts: i32 = conn.query_row("SELECT COUNT(*) FROM agent_accounts", [], |r| r.get(0)).unwrap_or(0);
    let active: i32 = conn.query_row("SELECT COUNT(*) FROM sessions WHERE status = 'active'", [], |r| r.get(0)).unwrap_or(0);

    if json {
        let mut stmt = conn.prepare("SELECT p.name, s.name, s.branch, s.status, s.worktree_path FROM sessions s JOIN projects p ON s.project_id = p.id WHERE s.status = 'active' ORDER BY p.name, s.last_opened DESC").unwrap();
        let sessions: Vec<serde_json::Value> = stmt
            .query_map([], |r| Ok(serde_json::json!({"project": r.get::<_,String>(0)?, "name": r.get::<_,String>(1)?, "branch": r.get::<_,String>(2)?, "status": r.get::<_,String>(3)?, "worktree_path": r.get::<_,String>(4)?})))
            .unwrap().filter_map(|r| r.ok()).collect();
        json_ok(serde_json::json!({"agents": agents, "accounts": accounts, "active_sessions": active, "sessions": sessions, "detected_project": project}));
        return;
    }

    println!("\n  {}\n", "NEX STATUS".bold());
    dim(&format!("Agents: {agents}  Accounts: {accounts}  Active sessions: {active}"));
    println!();

    if let Some(ref p) = project {
        println!("  {}", p.bold());
        let mut stmt = conn.prepare("SELECT s.name, s.branch, s.status FROM sessions s JOIN projects p ON s.project_id = p.id WHERE p.name = ?1 ORDER BY s.last_opened DESC").unwrap();
        let rows: Vec<(String, String, String)> = stmt.query_map(params![p], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?))).unwrap().filter_map(|r| r.ok()).collect();
        if rows.is_empty() { dim("  No active sessions"); } else {
            for (name, branch, status) in &rows {
                let icon = if status == "active" { "●" } else { "○" };
                println!("    {icon} {name:20} {branch:30} {status}");
            }
        }
    } else {
        let mut stmt = conn.prepare("SELECT p.name, s.name, s.branch, s.status FROM sessions s JOIN projects p ON s.project_id = p.id WHERE s.status = 'active' ORDER BY p.name, s.last_opened DESC").unwrap();
        let rows: Vec<(String, String, String, String)> = stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?))).unwrap().filter_map(|r| r.ok()).collect();
        if rows.is_empty() { dim("No active sessions"); } else {
            let mut cur = String::new();
            for (proj, name, branch, status) in &rows {
                if proj != &cur { cur = proj.clone(); println!("  {}", proj.bold()); }
                println!("    ● {name:20} {branch:30} {status}");
            }
        }
    }
    println!();
}

// ─── Doctor ───

fn cmd_doctor(conn: &rusqlite::Connection, json: bool) {
    let db_exists = db::db_path().exists();
    let agents: i32 = conn.query_row("SELECT COUNT(*) FROM agents", [], |r| r.get(0)).unwrap_or(0);
    let claude_path = which::which("claude").ok().map(|p| p.to_string_lossy().to_string());
    let gh_path = which::which("gh").ok().map(|p| p.to_string_lossy().to_string());

    let mut stmt = conn.prepare("SELECT id, worktree_path FROM sessions WHERE status = 'active'").unwrap();
    let orphans: Vec<(String, String)> = stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?))).unwrap().filter_map(|r| r.ok()).collect();
    let orphan_count = orphans.iter().filter(|(_, p)| !Path::new(p).is_dir()).count();

    if json {
        json_ok(serde_json::json!({
            "db_path": db::db_path().to_string_lossy(),
            "db_exists": db_exists,
            "agents": agents,
            "claude": claude_path,
            "gh": gh_path,
            "orphan_sessions": orphan_count,
        }));
        return;
    }

    println!("\n  {}\n", "NEX DOCTOR".bold());
    if db_exists { log(&format!("Database: {}", db::db_path().display())); } else { err("Database not found"); }
    if agents > 0 { log(&format!("Agents: {agents} registered")); } else { warn("No agents detected"); }
    if let Some(ref p) = claude_path { log(&format!("claude: {p}")); } else { warn("claude: not found in PATH"); }
    if let Some(ref p) = gh_path { log(&format!("gh: {p}")); } else { warn("gh: not found (needed for 'nex worktree pr')"); }
    if orphan_count > 0 { warn(&format!("Orphan sessions: {orphan_count}")); } else { log("No orphan sessions"); }
    println!();
}

// ─── Helpers ───

fn serde_json_mini(items: &[String]) -> String {
    let inner: Vec<String> = items.iter().map(|s| format!("\"{s}\"")).collect();
    format!("[{}]", inner.join(","))
}

fn parse_json_array(s: &str) -> Vec<String> {
    let t = s.trim().trim_start_matches('[').trim_end_matches(']');
    if t.is_empty() { return Vec::new(); }
    t.split(',').map(|v| v.trim().trim_matches('"').to_string()).filter(|v| !v.is_empty()).collect()
}

fn copy_dir_recursive(src: &Path, dst: &Path) {
    let _ = fs::create_dir_all(dst);
    if let Ok(entries) = fs::read_dir(src) {
        for entry in entries.flatten() {
            let sp = entry.path();
            let dp = dst.join(entry.file_name());
            if sp.is_dir() { copy_dir_recursive(&sp, &dp); } else { let _ = fs::copy(&sp, &dp); }
        }
    }
}
