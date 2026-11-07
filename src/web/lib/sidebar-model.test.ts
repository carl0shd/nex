import { describe, expect, it } from "vite-plus/test";
import type { Project, Session, Workspace } from "@native/db/types";
import { buildSidebar, shortAge, taskStatus, workspaceSummary } from "@/lib/sidebar-model";

const NOW = Date.parse("2026-10-28T12:00:00Z");

const workspace = (overrides: Partial<Workspace>): Workspace => ({
  id: "w1",
  name: "Monoku",
  color: "#33843F",
  icon: "",
  customImage: null,
  sortOrder: 0,
  archived: false,
  collapsed: false,
  createdAt: "",
  ...overrides,
});

const project = (overrides: Partial<Project>): Project => ({
  id: "p1",
  workspaceId: "w1",
  name: "nex",
  path: "~/code/nex",
  branchPrefix: "feat/",
  baseBranch: "",
  pullBase: true,
  setup: null,
  quickCommands: [],
  sortOrder: 0,
  createdAt: "",
  ...overrides,
});

const session = (overrides: Partial<Session>): Session => ({
  id: "s1",
  projectId: "p1",
  agentId: null,
  accountId: null,
  name: "fix-login-redirect",
  title: "Fix login redirect param",
  branch: "feat/fix-login-redirect",
  baseBranch: "main",
  worktreePath: "",
  notesPath: "",
  symlinks: [],
  status: "active",
  opens: 1,
  createdAt: "",
  lastOpened: "2026-10-28T11:48:00Z",
  diffVisible: false,
  notesVisible: false,
  verticalLayout: null,
  horizontalLayout: null,
  sortOrder: 0,
  width: 600,
  ...overrides,
});

describe("shortAge", () => {
  it("uses the compact sidebar form", () => {
    expect(shortAge(NOW - 30_000, NOW)).toBe("now");
    expect(shortAge(NOW - 12 * 60_000, NOW)).toBe("12m");
    expect(shortAge(NOW - 3 * 3_600_000, NOW)).toBe("3h");
    expect(shortAge(NOW - 2 * 86_400_000, NOW)).toBe("2d");
  });
});

describe("taskStatus", () => {
  it("prefers waiting over running over idle", () => {
    expect(taskStatus(["running", "waiting"])).toBe("waiting");
    expect(taskStatus(["idle", "running"])).toBe("running");
    expect(taskStatus([null])).toBe("idle");
    expect(taskStatus([])).toBe("idle");
  });
});

describe("buildSidebar", () => {
  it("nests projects and open tasks in order and hides archived workspaces", () => {
    const result = buildSidebar(
      {
        workspaces: [
          workspace({ id: "w2", name: "Personal", sortOrder: 1, collapsed: true }),
          workspace({}),
          workspace({ id: "w3", archived: true }),
        ],
        projects: [project({ id: "p2", name: "api", sortOrder: 1 }), project({})],
        sessions: [
          session({ id: "s2", name: "Closed", status: "done" }),
          session({ id: "s3", projectId: "p2", name: "Rename users" }),
          session({}),
        ],
        terminals: [{ sessionId: "s3", type: "agent", status: "waiting" }],
      },
      NOW,
    );

    expect(result.map((item) => [item.name, item.expanded])).toEqual([
      ["Monoku", true],
      ["Personal", false],
    ]);
    expect(result[0].projects.map((item) => item.name)).toEqual(["nex", "api"]);
    expect(result[0].projects[0].tasks).toEqual([
      { id: "s1", title: "Fix login redirect param", status: "idle", meta: "12m" },
    ]);
    expect(result[0].projects[1].tasks[0]).toMatchObject({ status: "waiting", meta: "needs you" });
  });

  it("ignores shell terminals when reading the agent state", () => {
    const result = buildSidebar(
      {
        workspaces: [workspace({})],
        projects: [project({})],
        sessions: [session({})],
        terminals: [{ sessionId: "s1", type: "shell", status: "running" }],
      },
      NOW,
    );
    expect(result[0].projects[0].tasks[0].status).toBe("idle");
  });
});

describe("workspaceSummary", () => {
  const task = (status: "running" | "waiting" | "idle") => ({
    id: status,
    title: "",
    status,
    meta: "",
  });
  const summary = (statuses: ("running" | "waiting" | "idle")[]) =>
    workspaceSummary({
      id: "w",
      name: "Monoku",
      color: "#33843F",
      expanded: true,
      projects: [{ name: "nex", tasks: statuses.map(task) }],
    });

  it("counts working and waiting tasks", () => {
    expect(summary(["running", "running", "waiting", "idle"])).toBe("2 working · 1 needs you");
  });

  it("falls back to idle tasks, then to no tasks", () => {
    expect(summary(["idle", "idle"])).toBe("2 idle");
    expect(summary([])).toBe("No tasks");
  });
});
