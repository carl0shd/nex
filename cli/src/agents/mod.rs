pub mod claude;

use rusqlite::Connection;

pub fn detect_all(conn: &Connection) {
    let count: i32 = conn
        .query_row("SELECT COUNT(*) FROM agents", [], |r| r.get(0))
        .unwrap_or(0);
    if count > 0 {
        return;
    }

    claude::detect(conn);
}
