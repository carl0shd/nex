use std::path::Path;
use std::process::Command;

pub fn detect_base_branch(repo: &str) -> String {
    let out = Command::new("git")
        .args(["symbolic-ref", "refs/remotes/origin/HEAD"])
        .current_dir(repo)
        .output();
    if let Ok(o) = out {
        let s = String::from_utf8_lossy(&o.stdout);
        if let Some(branch) = s.trim().strip_prefix("refs/remotes/origin/") {
            if !branch.is_empty() {
                return branch.to_string();
            }
        }
    }

    // If origin/HEAD is not set, try setting it from remote
    let _ = Command::new("git")
        .args(["remote", "set-head", "origin", "--auto"])
        .current_dir(repo)
        .output();

    let out = Command::new("git")
        .args(["symbolic-ref", "refs/remotes/origin/HEAD"])
        .current_dir(repo)
        .output();
    if let Ok(o) = out {
        let s = String::from_utf8_lossy(&o.stdout);
        if let Some(branch) = s.trim().strip_prefix("refs/remotes/origin/") {
            if !branch.is_empty() {
                return branch.to_string();
            }
        }
    }

    "main".to_string()
}

pub fn fetch_origin(repo: &str) {
    let _ = Command::new("git")
        .args(["fetch", "origin", "--quiet"])
        .current_dir(repo)
        .output();
}

pub fn create_worktree(repo: &str, branch: &str, path: &str, base: &str) -> Result<(), String> {
    let out = Command::new("git")
        .args(["worktree", "add", "-b", branch, path, base, "--quiet"])
        .current_dir(repo)
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).to_string());
    }
    Ok(())
}

pub fn remove_worktree(repo: &str, path: &str) -> Result<(), String> {
    let _ = Command::new("git")
        .args(["worktree", "remove", path, "--force"])
        .current_dir(repo)
        .output();
    let _ = Command::new("git")
        .args(["worktree", "prune"])
        .current_dir(repo)
        .output();
    Ok(())
}

pub fn delete_branch(repo: &str, branch: &str) -> bool {
    Command::new("git")
        .args(["branch", "-D", branch])
        .current_dir(repo)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

pub fn push_branch(wt_path: &str, branch: &str) -> Result<(), String> {
    let out = Command::new("git")
        .args(["push", "-u", "origin", branch])
        .current_dir(wt_path)
        .output()
        .map_err(|e| e.to_string())?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).to_string());
    }
    Ok(())
}

pub fn create_pr(wt_path: &str, base: &str, branch: &str, title: &str) -> Result<String, String> {
    let out = Command::new("gh")
        .args(["pr", "create", "--base", base, "--head", branch, "--title", title, "--body", ""])
        .current_dir(wt_path)
        .output()
        .map_err(|e| e.to_string())?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).to_string());
    }
    Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
}

pub fn ahead_behind(wt_path: &str, base: &str) -> (String, String) {
    let ahead = Command::new("git")
        .args(["rev-list", "--count", &format!("{base}..HEAD")])
        .current_dir(wt_path)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or("?".into());

    let behind = Command::new("git")
        .args(["rev-list", "--count", &format!("HEAD..{base}")])
        .current_dir(wt_path)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or("?".into());

    (ahead, behind)
}

pub fn changed_file_count(wt_path: &str) -> String {
    Command::new("git")
        .args(["status", "--porcelain"])
        .current_dir(wt_path)
        .output()
        .map(|o| {
            String::from_utf8_lossy(&o.stdout)
                .lines()
                .count()
                .to_string()
        })
        .unwrap_or("?".into())
}

pub fn diff_stat(wt_path: &str) -> String {
    Command::new("git")
        .args(["diff", "--stat", "HEAD"])
        .current_dir(wt_path)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default()
}

pub fn unpushed_count(wt_path: &str, branch: &str) -> usize {
    Command::new("git")
        .args(["log", "--oneline", &format!("origin/{branch}..HEAD")])
        .current_dir(wt_path)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).lines().count())
        .unwrap_or(0)
}

pub fn uncommitted_count(wt_path: &str) -> usize {
    Command::new("git")
        .args(["status", "--porcelain"])
        .current_dir(wt_path)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).lines().count())
        .unwrap_or(0)
}

pub fn setup_git_exclude(repo: &str) {
    let git_dir = Path::new(repo).join(".git");
    let real_git_dir = if git_dir.is_file() {
        let content = std::fs::read_to_string(&git_dir).unwrap_or_default();
        let target = content.trim().strip_prefix("gitdir: ").unwrap_or("");
        Path::new(repo).join(target)
    } else {
        git_dir
    };
    let exclude = real_git_dir.join("info/exclude");
    let _ = std::fs::create_dir_all(exclude.parent().unwrap());
    let content = std::fs::read_to_string(&exclude).unwrap_or_default();
    let mut additions = String::new();
    for pattern in &[".worktrees", "TASK_NOTES.md", "SHARED_CONTEXT.md"] {
        if !content.lines().any(|l| l.trim() == *pattern) {
            additions.push_str(pattern);
            additions.push('\n');
        }
    }
    if !additions.is_empty() {
        use std::io::Write;
        let mut f = std::fs::OpenOptions::new()
            .append(true)
            .create(true)
            .open(&exclude)
            .unwrap();
        f.write_all(additions.as_bytes()).unwrap();
    }
}

pub fn is_git_repo(path: &str) -> bool {
    Command::new("git")
        .args(["rev-parse", "--is-inside-work-tree"])
        .current_dir(path)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}
