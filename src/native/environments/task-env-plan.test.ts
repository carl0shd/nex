import { describe, expect, it } from "vite-plus/test";
import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import {
  admit,
  budgetGb,
  exitCodeFromBootLog,
  forwardedPath,
  forwardPlan,
  idleToPause,
  initialServices,
  logsCommand,
  MAX_SLUG,
  mountTargets,
  notesEnvironment,
  observedStatus,
  pauseAfterMs,
  pauseSuggestion,
  reconciledStatus,
  runAtMost,
  agentEnvironmentNote,
  forwardedPort,
  serviceUrl,
  slugSource,
  startsByItself,
  taskSlug,
  touchArgs,
  type IdleCandidate,
} from "@native/environments/task-env-plan";

const service = (overrides: Partial<EnvServiceDef>): EnvServiceDef => ({
  name: "web",
  kind: "app",
  image: "node:22-alpine",
  ports: [],
  env: {},
  dependsOn: [],
  memoryMb: 512,
  ...overrides,
});

const env: ProjectEnvironment = {
  services: [
    service({ name: "web", ports: [3000], dependsOn: ["db", "cache"] }),
    service({
      name: "api",
      kind: "build",
      image: "",
      build: { context: ".", dockerfile: "Dockerfile" },
      ports: [8000],
      mounts: [
        { source: "./backend/", target: "/app" },
        { source: "config", target: "/etc/app", readOnly: true },
      ],
      dependsOn: ["db"],
    }),
    service({ name: "worker", command: "celery -A app worker", dependsOn: ["db"] }),
    service({
      name: "db",
      kind: "image",
      image: "postgres:16-alpine",
      ports: [5432],
      data: { path: "/var/lib/postgresql/data" },
    }),
    service({ name: "cache", kind: "image", image: "redis:7", data: { path: "/data" } }),
  ],
  source: "detected",
  detectedFrom: [],
  warnings: [],
};

const candidate = (overrides: Partial<IdleCandidate>): IdleCandidate => ({
  sessionId: "a",
  status: "running",
  lastActiveAt: 0,
  viewing: false,
  agentRunning: false,
  ...overrides,
});

describe("task environment slug", () => {
  it("is short, DNS safe and unique", () => {
    expect(taskSlug("Fix login redirect", new Set())).toBe("fix-login-redirect");
    expect(taskSlug("Fix login redirect", new Set(["fix-login-redirect"]))).toBe(
      "fix-login-redirect-2",
    );
    const long = taskSlug("Rename every user table to accounts", new Set());
    expect(long.length).toBeLessThanOrEqual(MAX_SLUG);
    expect(long).toMatch(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/);
    expect(taskSlug("Rename every user table to accounts", new Set([long])).endsWith("-2")).toBe(
      true,
    );
  });

  it("starts from the task's name without the number a taken branch added", () => {
    expect(slugSource("testing-new-env-2", "testing new env")).toBe("testing-new-env");
    expect(slugSource("fix-issue-42", "Fix issue 42")).toBe("fix-issue-42");
    expect(slugSource("python-3-2", "Python 3")).toBe("python-3");
    expect(slugSource("fix-login", "Fix login")).toBe("fix-login");
  });

  it("never takes a name the check uses", () => {
    expect(taskSlug("check-ci", new Set())).toBe("t-check-ci");
    expect(taskSlug("¿?", new Set())).toBe("task");
  });
});

describe("queue and memory budget", () => {
  const budget = { maxRunning: 3, memoryGb: 8 };

  it("always lets the first environment start", () => {
    expect(admit({ active: 0, startingMb: 0, usedGb: 9 }, budget, 4096)).toEqual({ ok: true });
  });

  it("waits when the most environments are running", () => {
    expect(admit({ active: 3, startingMb: 0, usedGb: 1 }, budget, 512)).toEqual({
      ok: false,
      reason: "count",
    });
  });

  it("counts real use plus what is still starting against the budget", () => {
    expect(admit({ active: 1, startingMb: 0, usedGb: 6 }, budget, 1024)).toEqual({ ok: true });
    expect(admit({ active: 2, startingMb: 1536, usedGb: 6 }, budget, 1024)).toEqual({
      ok: false,
      reason: "memory",
    });
  });

  it("reads the preferences with safe defaults", () => {
    expect(runAtMost("5")).toBe(5);
    expect(runAtMost(undefined)).toBe(3);
    expect(runAtMost("0")).toBe(3);
    expect(pauseAfterMs("30")).toBe(30 * 60_000);
    expect(pauseAfterMs(undefined)).toBe(15 * 60_000);
    expect(pauseAfterMs("never")).toBeNull();
    expect(pauseAfterMs("0")).toBeNull();
    expect(budgetGb("12", [4, 8, 12])).toBe(12);
    expect(budgetGb("64", [4, 8, 12])).toBe(8);
    expect(budgetGb(undefined, [4])).toBe(4);
  });
});

describe("idle pause", () => {
  const minutes = (value: number) => value * 60_000;

  it("pauses environments nobody looked at or worked in for long enough", () => {
    const now = minutes(60);
    const all = [
      candidate({ sessionId: "old", lastActiveAt: minutes(10) }),
      candidate({ sessionId: "recent", lastActiveAt: minutes(55) }),
      candidate({ sessionId: "open", lastActiveAt: 0, viewing: true }),
      candidate({ sessionId: "working", lastActiveAt: 0, agentRunning: true }),
      candidate({ sessionId: "paused", lastActiveAt: 0, status: "paused" }),
      candidate({ sessionId: "down", lastActiveAt: 0, status: "down" }),
    ];
    expect(idleToPause(all, now, minutes(15))).toEqual(["old", "down"]);
    expect(idleToPause(all, now, null)).toEqual([]);
  });

  it("suggests pausing the one unused for the longest", () => {
    const all = [
      candidate({ sessionId: "a", lastActiveAt: 30 }),
      candidate({ sessionId: "b", lastActiveAt: 10 }),
      candidate({ sessionId: "c", lastActiveAt: 5, viewing: true }),
      candidate({ sessionId: "d", lastActiveAt: 1, status: "queued" }),
    ];
    expect(pauseSuggestion(all, "x")).toBe("b");
    expect(pauseSuggestion(all, "b")).toBe("a");
    expect(pauseSuggestion([candidate({ viewing: true })], "x")).toBeNull();
  });
});

describe("hot reload forwarding", () => {
  const targets = mountTargets(env, "fix-login");

  it("maps every writable bind mount to its container", () => {
    expect(targets).toEqual([
      { service: "web", container: "nex-fix-login-web", source: "", target: "/workspace" },
      { service: "api", container: "nex-fix-login-api", source: "backend", target: "/app" },
      { service: "worker", container: "nex-fix-login-worker", source: "", target: "/workspace" },
    ]);
  });

  it("touches the container paths of the changed files, one batch per container", () => {
    expect(forwardPlan(targets, ["backend/app/views.py", "src/App.tsx", "backend"])).toEqual([
      {
        container: "nex-fix-login-web",
        paths: ["/workspace/backend/app/views.py", "/workspace/src/App.tsx", "/workspace/backend"],
      },
      { container: "nex-fix-login-api", paths: ["/app/app/views.py", "/app"] },
      {
        container: "nex-fix-login-worker",
        paths: ["/workspace/backend/app/views.py", "/workspace/src/App.tsx", "/workspace/backend"],
      },
    ]);
    expect(forwardPlan(targets.slice(1, 2), ["backendless/x.py"])).toEqual([]);
  });

  it("caps a batch and touches without creating files", () => {
    const changed = Array.from({ length: 5 }, (_, index) => `backend/${index}.py`);
    const [batch] = forwardPlan(targets.slice(1, 2), changed, 2);
    expect(batch?.paths).toEqual(["/app/0.py", "/app/1.py"]);
    expect(touchArgs(batch!)).toEqual([
      "exec",
      "nex-fix-login-api",
      "sh",
      "-c",
      'for f; do touch -c -r "$f" "$f"; done',
      "sh",
      ...batch!.paths,
    ]);
  });

  it("touches the folder of a deleted file", () => {
    expect(forwardedPath("src/App.tsx", true)).toBe("src/App.tsx");
    expect(forwardedPath("src/Old.tsx", false)).toBe("src");
    expect(forwardedPath("Old.tsx", false)).toBe("");
  });
});

describe("reconciling with the containers on this Mac", () => {
  const expected = ["db", "web"];

  it("reads running, paused, down and gone", () => {
    expect(observedStatus(expected, [])).toEqual({ status: "none", stopped: [] });
    expect(
      observedStatus(expected, [
        { service: "db", running: true },
        { service: "web", running: true },
      ]).status,
    ).toBe("running");
    expect(
      observedStatus(expected, [
        { service: "db", running: false },
        { service: "web", running: false },
      ]).status,
    ).toBe("paused");
    expect(
      observedStatus(expected, [
        { service: "db", running: true },
        { service: "web", running: false },
      ]),
    ).toEqual({ status: "down", stopped: ["web"] });
  });

  it("keeps why an environment was paused, and resumes one the Mac stopped", () => {
    expect(
      reconciledStatus({ slug: "a", status: "paused", pausedReason: "you" }, "paused"),
    ).toEqual({ status: "paused", pausedReason: "you" });
    expect(reconciledStatus({ slug: "a", status: "running" }, "paused")).toEqual({
      status: "paused",
      pausedReason: "restart",
    });
    expect(reconciledStatus({ slug: "a", status: "failed" }, "none").status).toBe("failed");
    expect(reconciledStatus(undefined, "none").status).toBe("none");
    expect(reconciledStatus({ slug: "a", status: "paused" }, "running").status).toBe("running");
  });

  it("reads the exit code from the boot log", () => {
    const log = [
      "info vminitd: id: nex-a-web, pid: 128 started managed process",
      "info vminitd: id: nex-a-web, status: 1 managed process exit",
      "info vminitd: id: nex-a-web closing relay for StandardIO stdout",
    ].join("\n");
    expect(exitCodeFromBootLog(log)).toBe(1);
    expect(exitCodeFromBootLog("")).toBeNull();
  });
});

describe("services and addresses", () => {
  it("gives an address only to the services you open", () => {
    const services = initialServices(env, "fix-login");
    expect(services.map((item) => [item.name, item.url])).toEqual([
      ["db", null],
      ["cache", null],
      ["web", "http://fix-login.localhost:1355"],
      ["api", "http://api.fix-login.localhost:1355"],
      ["worker", null],
    ]);
    expect(services.every((item) => item.state === "waiting")).toBe(true);
    expect(services.find((item) => item.main)?.name).toBe("web");
    expect(services[2]?.localhostUrl).toBeNull();
  });

  it("opens at .nex without a port when both are on, .localhost one click away", () => {
    const web = env.services.find((item) => item.name === "web") as EnvServiceDef;
    const api = env.services.find((item) => item.name === "api") as EnvServiceDef;
    expect(serviceUrl(env, web, "fix-login", { port: 80, nex: true })).toEqual({
      address: "fix-login.nex",
      url: "http://fix-login.nex",
      localhostUrl: "http://fix-login.localhost",
    });
    expect(serviceUrl(env, api, "fix-login", { port: 1355, nex: true })).toEqual({
      address: "api.fix-login.nex:1355",
      url: "http://api.fix-login.nex:1355",
      localhostUrl: "http://api.fix-login.localhost:1355",
    });
    expect(serviceUrl(env, api, "fix-login", { port: 80, nex: false })).toEqual({
      address: "api.fix-login.localhost",
      url: "http://api.fix-login.localhost",
      localhostUrl: null,
    });
  });

  it("forwards the Mac port a data store or a page you open publishes", () => {
    const stored = env.services.find((item) => item.name === "db")!;
    const db = { ...stored, ports: [5432], hostPorts: [{ host: 15432, container: 5432 }] };
    expect(forwardedPort(db)).toBe(15432);
    expect(forwardedPort({ ...stored, ports: [] })).toBeNull();
    const web = env.services.find((item) => item.name === "web")!;
    expect(forwardedPort({ ...web, hostPorts: [{ host: 5173, container: web.ports[0]! }] })).toBe(
      5173,
    );
    expect(forwardedPort(env.services.find((item) => item.name === "worker")!)).toBeNull();
  });

  it("follows one service's log, or all of them labelled", () => {
    expect(logsCommand("/usr/local/bin/container", "a", ["web"])).toBe(
      "'/usr/local/bin/container' logs -n 200 -f nex-a-web",
    );
    const all = logsCommand("/usr/local/bin/container", "a", ["db", "web"]);
    expect(all).toContain("logs -n 50 -f nex-a-db 2>&1 | sed -u 's/^/db  | /') &");
    expect(all).toContain("logs -n 50 -f nex-a-web 2>&1 | sed -u 's/^/web | /') &");
    expect(all.endsWith("wait)")).toBe(true);
  });

  it("tells the agent where its services answer and how to reach them", () => {
    const services = initialServices(env, "fix-login", "ready", { port: 80, nex: true });
    const note = agentEnvironmentNote("fix-login", services, "/usr/local/bin/container") ?? "";
    expect(note).toContain(
      "- web: http://fix-login.nex · inside the task web:3000 (container nex-fix-login-web)",
    );
    expect(note).toContain("- worker (container nex-fix-login-worker)");
    expect(note).toContain("`/usr/local/bin/container exec <container> <command>`");
    expect(agentEnvironmentNote("fix-login", [], "container")).toBeNull();
  });
});

describe("tasks created without their environment", () => {
  it("starts a new environment by itself only when the task did not turn it off", () => {
    expect(startsByItself({ status: "none" }, false)).toBe(true);
    expect(startsByItself({ status: "none" }, true)).toBe(false);
  });

  it("resumes an idle pause but never one you asked for", () => {
    expect(startsByItself({ status: "paused", pausedReason: "idle" }, false)).toBe(true);
    expect(startsByItself({ status: "paused", pausedReason: "you" }, false)).toBe(false);
    expect(startsByItself({ status: "running" }, false)).toBe(false);
  });

  it("tells Claude about the environment unless it is off and never started", () => {
    expect(notesEnvironment("none", true)).toBe(false);
    expect(notesEnvironment("none", false)).toBe(true);
    expect(notesEnvironment("queued", true)).toBe(true);
  });
});
