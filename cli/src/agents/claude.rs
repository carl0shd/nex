use colored::Colorize;
use rusqlite::Connection;
use std::process::Command;

struct AuthInfo {
    email: Option<String>,
}

fn get_auth_status(config_dir: &str) -> Option<AuthInfo> {
    let claude_path = which::which("claude").ok()?;
    let output = Command::new(&claude_path)
        .args(["auth", "status"])
        .output()
        .ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let text = if !stdout.trim().is_empty() {
        stdout.to_string()
    } else if !stderr.trim().is_empty() {
        stderr.to_string()
    } else {
        return None;
    };
    let parsed: serde_json::Value = serde_json::from_str(text.trim()).ok()?;

    if !parsed.get("loggedIn")?.as_bool()? {
        return None;
    }

    let email = parsed
        .get("email")
        .and_then(|e| e.as_str())
        .map(|s| s.to_string());

    Some(AuthInfo { email })
}

pub fn detect(conn: &Connection) {
    if which::which("claude").is_err() {
        return;
    }

    let home = dirs::home_dir().unwrap();
    let claude_dir = home.join(".claude");

    if !claude_dir.exists() {
        return;
    }

    let config_dir = claude_dir.to_string_lossy().to_string();
    let auth = get_auth_status(&config_dir);
    let email = auth.as_ref().and_then(|a| a.email.as_deref());

    let agent_id = uuid::Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO agents (id, name, slug, command, default_config_dir, config_env_var, resume_args, skip_permissions_args, builtin) VALUES (?1, 'Anthropic Claude Code', 'claude-code', 'claude', ?2, 'CLAUDE_CONFIG_DIR', '[\"--resume\"]', '[\"--dangerously-skip-permissions\"]', 1)",
        rusqlite::params![agent_id, config_dir],
    ).unwrap();

    if let Some(email) = email {
        let account_id = uuid::Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO agent_accounts (id, agent_id, name, config_dir, is_default) VALUES (?1, ?2, ?3, ?4, 1)",
            rusqlite::params![account_id, agent_id, email, config_dir],
        ).unwrap();
        println!("  {} Auto-detected Anthropic Claude Code ({})", "✓".green(), email);
    } else {
        println!("  {} Auto-detected Anthropic Claude Code (not logged in)", "✓".green());
    }
}
