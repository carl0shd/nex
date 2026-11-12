import { describe, expect, it } from "vite-plus/test";
import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import type { EnvCheckState } from "@native/environments/types";
import {
  addService,
  addressOf,
  advancedSummary,
  environmentNotices,
  environmentPhrase,
  foundServices,
  groupServices,
  issuesLabel,
  memoryOptions,
  mountsNote,
  parsePorts,
  removeService,
  seedSummary,
  serviceCheck,
  serviceDetail,
  serviceRole,
  sourcesLine,
  testStatus,
  updateService,
} from "@/lib/project-environment";

const service = (overrides: Partial<EnvServiceDef>): EnvServiceDef => ({
  name: "web",
  kind: "app",
  image: "node:22-alpine",
  ports: [],
  env: {},
  dependsOn: [],
  memoryMb: 1024,
  ...overrides,
});

const ENV: ProjectEnvironment = {
  source: "detected",
  detectedFrom: ["docker-compose.yml", "package.json", "pnpm-lock.yaml", ".nvmrc"],
  warnings: [],
  services: [
    service({ name: "web", command: "pnpm dev", ports: [5173], dependsOn: ["db"] }),
    service({ name: "api", command: "pnpm api", ports: [8000], dependsOn: ["db"] }),
    service({
      name: "db",
      kind: "image",
      image: "postgres:16-alpine",
      seed: { file: "db/seed.sql" },
    }),
  ],
};

describe("project environment", () => {
  it("shows the task's addresses with a placeholder", () => {
    const [web, api, db] = ENV.services as [EnvServiceDef, EnvServiceDef, EnvServiceDef];
    expect(addressOf(ENV, web)).toBe("{task}.nex");
    expect(addressOf(ENV, api)).toBe("api.{task}.nex");
    expect(addressOf(ENV, db)).toBeNull();
  });

  it("groups services by what they are for", () => {
    const worker = service({ name: "flower", ports: [5555] });
    const beat = service({ name: "scheduler-2", command: "celery -A app beat", ports: [80] });
    const mailpit = service({
      name: "mailpit",
      kind: "image",
      image: "axllent/mailpit",
      ports: [8025],
    });
    const redis = service({ name: "cache", kind: "image", image: "redis:7-alpine" });
    const files = service({
      name: "minio",
      kind: "image",
      image: "minio",
      data: { path: "/data" },
    });
    expect(serviceRole(worker)).toBe("background");
    expect(serviceRole(beat)).toBe("background");
    expect(serviceRole(service({ name: "jobs", command: "/start-celeryworker" }))).toBe(
      "background",
    );
    expect(serviceRole(service({ name: "hocuspocus", ports: [1234] }))).toBe("open");
    expect(serviceRole(mailpit)).toBe("open");
    expect(serviceRole(redis)).toBe("data");
    expect(serviceRole(files)).toBe("data");
    expect(serviceRole(service({ name: "bot" }))).toBe("background");
    expect(groupServices(ENV)).toEqual({ open: [0, 1], background: [], data: [2] });
  });

  it("keeps an open service in its group while it is edited", () => {
    const moved = updateService(ENV, "api", { ports: [] });
    expect(groupServices(moved).background).toEqual([1]);
    expect(groupServices(moved, { index: 1, role: "open" })).toEqual({
      open: [0, 1],
      background: [],
      data: [2],
    });
  });

  it("describes where the services came from", () => {
    expect(sourcesLine(ENV)).toBe(
      "Found in docker-compose.yml, package.json, pnpm-lock.yaml, .nvmrc",
    );
    expect(sourcesLine({ ...ENV, source: "edited" })).toMatch(/^Edited · first found in docker/);
    expect(sourcesLine({ ...ENV, detectedFrom: [] })).toBe("Nothing found in this project");
    expect(environmentPhrase(ENV, "atlas")).toEqual([
      { text: "Each task runs atlas’s 3 services" },
    ]);
    expect(environmentPhrase({ ...ENV, services: ENV.services.slice(2) }, "atlas")).toEqual([
      { text: "Each task runs its own db" },
    ]);
  });

  it("sums up what is folded away", () => {
    const [web, api, db] = ENV.services as [EnvServiceDef, EnvServiceDef, EnvServiceDef];
    expect(advancedSummary(web)).toBe("image, ports, starts after db");
    expect(advancedSummary({ ...api, kind: "build", env: { A: "1" } })).toBe(
      "Dockerfile, ports, variables, starts after db",
    );
    expect(advancedSummary(db)).toBe("image");
    expect(seedSummary(ENV)).toBe("Nothing to run");
    expect(
      seedSummary({
        ...ENV,
        prepare: [{ service: "db", command: "seed" }],
        taskPrepare: [
          { service: "api", command: "migrate" },
          { service: "web", command: "build" },
        ],
      }),
    ).toBe("1 seed step · 2 steps in every task");
    expect(issuesLabel(1)).toBe("1 thing to check");
    expect(issuesLabel(2)).toBe("2 things to check");
  });

  it("renames, removes and adds services, keeping dependencies in step", () => {
    const renamed = updateService(ENV, "db", { name: "postgres" });
    expect(renamed.source).toBe("edited");
    expect(renamed.services.map((item) => item.dependsOn)).toEqual([
      ["postgres"],
      ["postgres"],
      [],
    ]);
    const removed = removeService(renamed, "postgres");
    expect(removed.services.map((item) => [item.name, item.dependsOn])).toEqual([
      ["web", []],
      ["api", []],
    ]);
    const withSteps = {
      ...ENV,
      prepare: [{ service: "db", command: "psql -f seed.sql" }],
      taskPrepare: [{ service: "api", command: "pnpm migrate" }],
    };
    expect(updateService(withSteps, "db", { name: "postgres" }).prepare).toEqual([
      { service: "postgres", command: "psql -f seed.sql" },
    ]);
    const dropped = removeService(withSteps, "db");
    expect(dropped.prepare).toEqual([]);
    expect(dropped.taskPrepare).toEqual(withSteps.taskPrepare);
    const added = addService(addService(removed, "image").env, "image");
    expect(added.name).toBe("service-2");
    expect(added.env.services.at(-1)).toMatchObject({ kind: "image", image: "", memoryMb: 256 });
    expect(addService(removed, "build").env.services.at(-1)).toMatchObject({
      name: "app",
      kind: "build",
      build: { context: "", dockerfile: "Dockerfile" },
      memoryMb: 1536,
    });
  });

  it("reads ports and memory choices", () => {
    expect(parsePorts("5173, 24678 5173 nope 0")).toEqual([5173, 24678]);
    expect(memoryOptions(640).map((option) => option.label)).toEqual([
      "256 MB",
      "384 MB",
      "512 MB",
      "640 MB",
      "768 MB",
      "1 GB",
      "1.5 GB",
      "2 GB",
      "3 GB",
      "4 GB",
    ]);
  });

  it("turns check progress into a status per service", () => {
    const check: EnvCheckState = {
      projectPath: "/p",
      phase: "failed",
      startedAt: 0,
      error: "api stopped: boom",
      services: [
        { name: "db", state: "ready", detail: "Ready in 2.0s" },
        { name: "api", state: "pulling" },
        { name: "web", state: "skipped" },
      ],
    };
    expect(serviceCheck(check, "db")).toEqual({
      tone: "green",
      label: "Ready",
      detail: "Ready in 2.0s",
      busy: false,
    });
    expect(serviceCheck(check, "api")?.busy).toBe(true);
    expect(
      serviceCheck({ ...check, services: [{ name: "api", state: "building" }] }, "api"),
    ).toMatchObject({ label: "Building", busy: true });
    expect(serviceCheck(check, "web")?.label).toBe("Not started");
    expect(serviceCheck(check, "ghost")).toBeNull();
  });

  it("says how the last test went in one line", () => {
    const NOW = 10 * 60_000;
    const base: EnvCheckState = {
      projectPath: "/p",
      phase: "running",
      startedAt: 0,
      services: [
        { name: "db", state: "ready" },
        { name: "api", state: "starting" },
        { name: "web", state: "waiting" },
      ],
    };
    expect(testStatus(null, NOW)).toMatchObject({ tone: "idle", label: "Not tested yet" });
    expect(testStatus(base, NOW)).toMatchObject({
      label: "Testing…",
      hint: "1 of 3 ready",
      busy: true,
    });
    const done = { ...base, phase: "done" as const, finishedAt: 5 * 60_000 };
    expect(testStatus(done, NOW)).toMatchObject({
      tone: "green",
      label: "Everything starts",
      hint: "Tested 5m ago",
    });
    expect(
      testStatus({ ...done, services: [{ name: "web", state: "ready", silent: true }] }, NOW),
    ).toMatchObject({ tone: "orange", hint: "1 isn’t answering yet · Tested 5m ago" });
    const failed: EnvCheckState = {
      ...done,
      phase: "failed",
      error: "boom",
      services: [
        { name: "db", state: "failed" },
        { name: "api", state: "failed" },
      ],
    };
    expect(testStatus(failed, NOW)).toMatchObject({
      tone: "red",
      label: "2 need attention",
      hint: "boom",
    });
    expect(testStatus({ ...failed, services: [] }, NOW).label).toBe("The test didn’t finish");
    expect(testStatus({ ...failed, error: "Stopped" }, NOW)).toMatchObject({
      tone: "idle",
      label: "Test stopped",
    });
  });

  it("lists services for the onboarding card", () => {
    expect(foundServices(ENV)).toEqual([
      { name: "web", detail: "pnpm dev", code: true, meta: ":5173", address: "task.nex" },
      { name: "api", detail: "pnpm api", code: true, meta: ":8000", address: "api.task.nex" },
      {
        name: "db",
        detail: "postgres:16-alpine",
        code: true,
        meta: ":5432 · seeds from db/seed.sql",
      },
    ]);
  });

  it("describes services built from the project", () => {
    const django = service({
      name: "django",
      kind: "build",
      image: "",
      build: { context: "triton", dockerfile: "triton/Dockerfile", target: "dev" },
      mounts: [
        { source: "triton", target: "/app" },
        { source: "", target: "/repo", readOnly: true },
      ],
      volumes: ["/app/.venv"],
    });
    expect(serviceDetail(django)).toBe("Built from triton/Dockerfile · dev stage");
    expect(mountsNote(django)).toBe(
      "Mounts triton at /app and the project at /repo (read only). Keeps /app/.venv from the image in each task.",
    );
    expect(mountsNote(service({}))).toBeNull();
    expect(foundServices({ ...ENV, services: [django] })[0]?.code).toBe(false);
  });

  it("shows each problem once, errors before warnings", () => {
    const env: ProjectEnvironment = {
      ...ENV,
      services: [service({ name: "web", image: "" }), service({ name: "web-2" })],
      warnings: ["Pick the image web runs on.", "web-2: .env is missing.", "web needs an image."],
    };
    expect(environmentNotices(env)).toEqual({
      problems: ["web needs an image."],
      warnings: ["web-2: .env is missing."],
    });
  });
});
