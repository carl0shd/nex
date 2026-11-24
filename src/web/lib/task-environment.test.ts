import { describe, expect, it } from "vite-plus/test";
import type { Project, Session } from "@native/db/types";
import type { TaskEnvService, TaskEnvState } from "@native/environments/types";
import { sidebarEnv } from "@/lib/sidebar-model";
import {
  bannerState,
  blockedTitle,
  closeEnvironment,
  envButtonLabel,
  envButtonState,
  idleCount,
  machineEnvironments,
  mainAddress,
  menuServices,
  sizeLabel,
  startProgress,
  startStatus,
} from "@/lib/task-environment";

const service = (overrides: Partial<TaskEnvService>): TaskEnvService => ({
  name: "db",
  state: "ready",
  address: null,
  url: null,
  localhostUrl: null,
  localPort: null,
  main: false,
  ports: [5432],
  ...overrides,
});

const env = (overrides: Partial<TaskEnvState> = {}): TaskEnvState => ({
  sessionId: "s1",
  projectId: "p1",
  slug: "fix-login",
  status: "running",
  services: [
    service({}),
    service({
      name: "api",
      ports: [8000],
      address: "api.fix-login.nex",
      url: "http://api.fix-login.nex",
      localhostUrl: "http://api.fix-login.localhost",
    }),
    service({
      name: "web",
      ports: [3000],
      address: "fix-login.nex",
      url: "http://fix-login.nex",
      localhostUrl: "http://fix-login.localhost",
      main: true,
    }),
    service({ name: "worker", ports: [] }),
  ],
  steps: [],
  memoryMb: 2048,
  usedGb: 1.2,
  lastActiveAt: 0,
  idle: false,
  ...overrides,
});

describe("task environment button and menu", () => {
  it("shows a state for every environment that exists", () => {
    expect(envButtonState(undefined)).toBeNull();
    expect(envButtonState(env({ status: "none" }))).toBeNull();
    expect(envButtonState(env({ status: "queued" }))).toBe("waiting");
    expect(envButtonState(env({ status: "failed" }))).toBe("down");
    expect(envButtonState(env())).toBe("running");
  });

  it("names it by the task's main address", () => {
    expect(mainAddress(env())).toEqual({
      label: "fix-login.nex",
      url: "http://fix-login.nex",
    });
    expect(envButtonLabel(env())).toBe("fix-login.nex · 4 services running");
    expect(
      envButtonLabel(env({ status: "down", down: { service: "api", code: 1, line: "" } })),
    ).toBe("fix-login.nex · api stopped");
    expect(envButtonLabel(env({ services: [service({})] }))).toBe(
      "Environment · 1 service running",
    );
  });

  it("lists services with their address or what they keep inside the task", () => {
    expect(menuServices(env()).map((item) => [item.name, item.detail, item.state])).toEqual([
      ["db", ":5432 · inside the task", "up"],
      ["api", "api.fix-login.nex", "up"],
      ["web", "fix-login.nex", "up"],
      ["worker", "Inside the task", "up"],
    ]);
    expect(menuServices(env({ status: "paused" })).every((item) => item.state === "paused")).toBe(
      true,
    );
  });

  it("offers .localhost after every .nex address", () => {
    const [db, api] = menuServices(env());
    expect(api?.url).toBe("http://api.fix-login.nex");
    expect(api?.addresses?.map((item) => item.url)).toEqual([
      "http://api.fix-login.nex",
      "http://api.fix-login.localhost",
    ]);
    expect(db?.addresses).toBeUndefined();
  });

  it("opens the task address, with localhost for the viewed task in its menu", () => {
    const published = env({
      services: env().services.map((item) =>
        item.name === "web" ? { ...item, localPort: 5173 } : item,
      ),
    });
    const web = menuServices(published).find((item) => item.name === "web");
    expect(web?.url).toBe("http://fix-login.nex");
    expect(web?.detail).toBe("fix-login.nex");
    expect(web?.addresses?.map((item) => item.label)).toEqual(["fix-login.nex", "localhost:5173"]);
    expect(mainAddress(published)?.url).toBe("http://fix-login.nex");
    const blocked = { ...published, blockedPorts: [{ port: 5173, reason: "taken" as const }] };
    expect(menuServices(blocked).find((item) => item.name === "web")?.addresses?.[1]?.url).toBe(
      "http://fix-login.localhost",
    );
  });

  it("names the Mac port a database answers on while you view the task", () => {
    const forwarded = env({ services: [service({ localPort: 15432 })] });
    expect(menuServices(forwarded)[0]?.detail).toBe("localhost:15432 · while you view this task");
  });

  it("warns about a port another app holds", () => {
    const blocked = env({ blockedPorts: [{ port: 8000, reason: "taken", service: "api" }] });
    expect(menuServices(blocked).find((item) => item.name === "api")?.warning).toBe(
      "Port 8000 is used by another app",
    );
    expect(bannerState(blocked, 0)).toEqual({
      kind: "ports",
      title: "Port 8000 is used by another app",
      detail: "Nex takes it as soon as it’s free",
    });
    expect(
      blockedTitle([
        { port: 8000, reason: "taken" },
        { port: 1234, reason: "taken" },
      ]),
    ).toBe("Ports 8000 and 1234 are used by other apps");
    expect(blockedTitle([{ port: 80, reason: "denied" }])).toBe(
      "Port 80 needs administrator rights",
    );
  });
});

describe("starting, waiting, down and paused", () => {
  const starting = env({
    status: "starting",
    startedAt: 1000,
    services: [
      service({}),
      service({ name: "api", state: "starting" }),
      service({ name: "web", state: "waiting" }),
    ],
  });

  it("counts every service that is ready, then the steps that fill its data", () => {
    expect(startProgress(starting)).toEqual({ step: 1, total: 3 });
    expect(bannerState(starting, 7000)).toEqual({
      kind: "starting",
      elapsed: "6s",
      services: [
        { name: "db", state: "done" },
        { name: "api", state: "running" },
        { name: "web", state: "pending" },
      ],
    });
    expect(startStatus(starting)).toEqual({ kind: "starting", step: 1, total: 3 });
    const filling = {
      ...starting,
      services: starting.services.map((item) => ({ ...item, state: "ready" as const })),
      steps: [{ service: "api", command: "make seed", state: "running" as const }],
    };
    expect(startStatus(filling)).toEqual({ kind: "filling", step: 3, total: 4 });
    expect(bannerState(filling, 7000)).toMatchObject({
      services: [
        { name: "db", state: "done" },
        { name: "api", state: "done" },
        { name: "web", state: "done" },
        { name: "api data", state: "running" },
      ],
    });
  });

  it("says why it waits and which task to pause", () => {
    const queued = env({
      status: "queued",
      waiting: {
        reason: "memory",
        running: 2,
        max: 3,
        usedGb: 7.42,
        budgetGb: 8,
        suggestion: { sessionId: "s2", title: "Usage panel charts" },
      },
    });
    expect(bannerState(queued, 0)).toEqual({
      kind: "waiting",
      reason: "memory",
      detail: "7.4 of 8 GB in use",
      suggestion: "Usage panel charts",
    });
    expect(startStatus(queued)).toEqual({
      kind: "waiting",
      running: 2,
      max: 3,
      suggestion: "Usage panel charts",
    });
  });

  it("explains a paused, down or failed environment", () => {
    expect(
      bannerState(env({ status: "paused", pausedReason: "idle", idleMinutes: 15 }), 0),
    ).toEqual({
      kind: "paused",
      idleFor: "15 min",
    });
    expect(bannerState(env({ status: "paused", pausedReason: "you" }), 0)).toEqual({
      kind: "paused",
      idleFor: undefined,
    });
    expect(
      bannerState(
        env({ status: "down", down: { service: "api", code: 1, line: "Error: boom" } }),
        0,
      ),
    ).toEqual({ kind: "down", service: "api", code: 1, error: "Error: boom" });
    expect(bannerState(env({ status: "failed", error: "api didn’t start" }), 0)).toEqual({
      kind: "failed",
      error: "api didn’t start",
    });
    expect(bannerState(env(), 0)).toBeNull();
  });

  it("shows the addresses once it is ready", () => {
    expect(startStatus(env({ readyMs: 3100 }))).toEqual({
      kind: "ready",
      addresses: [
        { label: "api.fix-login.nex", url: "http://api.fix-login.nex" },
        { label: "fix-login.nex", url: "http://fix-login.nex" },
      ],
      readyIn: "3s",
    });
  });
});

describe("sidebar and machine popover", () => {
  const session = (id: string, title: string) => ({ id, title, name: id }) as Session;
  const project = { id: "p1", name: "nex" } as Project;

  it("marks tasks that start or broke", () => {
    expect(sidebarEnv(env({ status: "starting" }))).toBe("starting");
    expect(sidebarEnv(env({ status: "failed" }))).toBe("down");
    expect(sidebarEnv(env({ status: "paused" }))).toBeUndefined();
  });

  it("lists each environment with what it uses and suggests the idlest one when full", () => {
    const all = [
      env({ sessionId: "a", usedGb: 2.6 }),
      env({ sessionId: "b", idle: true, lastActiveAt: 0, usedGb: 1.1 }),
      env({ sessionId: "c", status: "paused", pausedAt: 0 }),
      env({ sessionId: "d", status: "none" }),
    ];
    const listed = machineEnvironments(
      {
        environments: all,
        sessions: [session("a", "Fix login"), session("b", "Usage panel"), session("c", "Bump")],
        projects: [project],
        nearlyFull: true,
      },
      40 * 60_000,
    );
    expect(listed).toEqual([
      {
        id: "a",
        title: "Fix login",
        project: "nex",
        detail: "4 services",
        state: "running",
        gb: 2.6,
        suggested: false,
      },
      {
        id: "b",
        title: "Usage panel",
        project: "nex",
        detail: "idle 40 min",
        state: "running",
        gb: 1.1,
        suggested: true,
      },
      { id: "c", title: "Bump", project: "nex", detail: "", state: "paused", pausedFor: "40m" },
    ]);
    expect(idleCount(all)).toBe(1);
  });

  it("tells the close dialog what goes away", () => {
    expect(closeEnvironment(undefined, null)).toBeUndefined();
    expect(closeEnvironment(env({ status: "none" }), null)).toBeUndefined();
    expect(closeEnvironment(env(), 240e6)).toEqual({
      size: "240 MB",
      address: "fix-login.nex",
    });
  });
});

describe("sizes", () => {
  it("formats sizes in MB or GB", () => {
    expect(sizeLabel(340e6)).toBe("340 MB");
    expect(sizeLabel(1.42e9)).toBe("1.4 GB");
  });
});
