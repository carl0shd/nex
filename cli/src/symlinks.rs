use std::fs;
use std::os::unix::fs::symlink;
use std::path::Path;

pub fn setup(repo_root: &str, wt_path: &str, symlinks: &[String]) {
    for item in symlinks {
        if item == ".claude" {
            setup_claude_shallow(repo_root, wt_path);
        } else {
            let src = Path::new(repo_root).join(item);
            let dst = Path::new(wt_path).join(item);
            if src.exists() && !dst.exists() {
                let _ = symlink(&src, &dst);
            }
        }
    }
}

fn setup_claude_shallow(repo_root: &str, wt_path: &str) {
    let src_dir = Path::new(repo_root).join(".claude");
    if !src_dir.is_dir() {
        return;
    }

    let dst_dir = Path::new(wt_path).join(".claude");
    let _ = fs::create_dir_all(&dst_dir);

    let entries = match fs::read_dir(&src_dir) {
        Ok(e) => e,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if name_str == "plans" || name_str == "settings.local.json" {
            continue;
        }
        let dst = dst_dir.join(&name);
        if !dst.exists() {
            let _ = symlink(entry.path(), &dst);
        }
    }
}
