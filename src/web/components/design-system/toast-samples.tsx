import type { CompactToastProps, ToastProps } from "@/components/primitives/toast";

export const NEEDS_YOU: ToastProps = {
  tone: "orange",
  status: "Needs you",
  meta: "api · feat/accounts-table",
  time: "now",
  title: "Rename users to accounts",
  body: "Wants to run a command",
  code: 'psql $DATABASE_URL -c "DROP TABLE users_old"',
  actions: [
    { label: "Allow once", kind: "green" },
    { label: "Deny", kind: "danger" },
    { label: "Open", kind: "ghost" },
  ],
};

export const DONE: ToastProps = {
  tone: "green",
  status: "Done",
  meta: "nex · 14m",
  time: "now",
  title: "Fix login redirect param",
  body: "6 files changed · +128 −14 · 4 tests passed",
  actions: [
    { label: "Review changes", kind: "neutral" },
    { label: "Open", kind: "ghost" },
  ],
};

export const STOPPED: ToastProps = {
  tone: "red",
  status: "Stopped",
  meta: "nex · feat/usage-panel",
  time: "2m",
  title: "Usage panel charts",
  body: "Claude Code exited with code 1. Your changes are still in the worktree.",
  actions: [
    { label: "Restart", kind: "neutral" },
    { label: "View output", kind: "ghost" },
  ],
};

export const CREATING: ToastProps = {
  tone: "neutral",
  status: "Creating",
  working: true,
  meta: "nex",
  title: "fix-login-redirect",
  body: "Installing dependencies · yarn install",
  progress: 62,
};

export const ARCHIVED: ToastProps = {
  tone: "neutral",
  status: "Archived",
  meta: "nex",
  title: "Bump Electron to 39.2",
  body: "The worktree is kept for 7 days.",
  actions: [{ label: "Undo", kind: "ghost", kbd: "⌘Z" }],
  countdown: 6000,
};

export const CREATE_FAILED: ToastProps = {
  tone: "red",
  status: "Failed",
  meta: "nex",
  time: "now",
  title: "Couldn't create the task",
  code: "fatal: invalid reference: main2",
  actions: [
    { label: "Try again", kind: "neutral" },
    { label: "Copy error", kind: "ghost" },
  ],
};

export const LIMIT: ToastProps = {
  tone: "orange",
  status: "86% used",
  meta: "Work · Max",
  time: "now",
  title: "Session limit almost reached",
  body: "At this pace you hit it in about 32 min. It resets at 5:20 PM.",
  actions: [
    { label: "Use Personal", kind: "neutral" },
    { label: "Dismiss", kind: "ghost" },
  ],
};

export const UPDATE: ToastProps = {
  tone: "blue",
  status: "Update",
  time: "now",
  title: "Nex 2.1 is ready",
  body: "Restart to update. Running agents pick up where they left off.",
  actions: [
    { label: "Restart now", kind: "neutral" },
    { label: "Later", kind: "ghost" },
  ],
};

export const COPIED: CompactToastProps = { tone: "green", title: "Path copied" };

export const PUSHED: CompactToastProps = {
  tone: "green",
  title: "Pushed to origin",
  action: "Open PR",
};

export const READ_FAILED: CompactToastProps = { tone: "red", title: "Couldn't read session.ts" };
