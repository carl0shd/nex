use rusqlite::Connection;
use std::env;

pub fn detect_project(conn: &Connection) -> Option<String> {
    let cwd = env::current_dir().ok()?.to_string_lossy().to_string();
    conn.query_row(
        "SELECT name FROM projects WHERE ?1 LIKE path || '%' ORDER BY LENGTH(path) DESC LIMIT 1",
        [&cwd],
        |row| row.get(0),
    )
    .ok()
}

pub fn detect_task() -> Option<String> {
    let cwd = env::current_dir().ok()?.to_string_lossy().to_string();
    let marker = "/.worktrees/";
    let idx = cwd.find(marker)?;
    let after = &cwd[idx + marker.len()..];
    Some(after.split('/').next()?.to_string())
}

pub fn require_project(conn: &Connection, arg: Option<&str>) -> Result<String, String> {
    if let Some(name) = arg {
        return Ok(name.to_string());
    }
    detect_project(conn).ok_or_else(|| {
        "No project specified and could not detect from cwd. Run from inside a registered project or pass the project name.".to_string()
    })
}
