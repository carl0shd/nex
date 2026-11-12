import { describe, expect, it } from "vite-plus/test";
import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import {
  baseStatus,
  baseTaskSlug,
  baseVolumeArgs,
  baseVolumes,
  clonePlan,
  isMigrationPath,
  migrationFingerprint,
  planSteps,
  prepareExecArgs,
  setupKey,
  startDetail,
  stopArgs,
  stopOrder,
} from "@native/environments/clean-base-plan";
import type { CleanBaseRecord } from "@native/environments/types";

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
    service({ name: "worker", dependsOn: ["db"] }),
    service({
      name: "db",
      kind: "image",
      image: "postgres:16-alpine",
      env: { POSTGRES_PASSWORD: "postgres" },
      data: { path: "/var/lib/postgresql/data" },
    }),
    service({ name: "cache", kind: "image", image: "redis:7", data: { path: "/data" } }),
  ],
  taskPrepare: [{ service: "web", command: "npx prisma migrate deploy" }],
  prepare: [{ service: "web", command: "npx prisma db seed" }],
  source: "detected",
  detectedFrom: [],
  warnings: [],
};

const ready: CleanBaseRecord = {
  status: "ready",
  volumes: baseVolumes(env, "abc"),
  steps: [],
  startedAt: 1,
  fingerprint: "f1",
  setupKey: setupKey(env),
};

describe("clean base plan", () => {
  it("names one base volume per data service, labelled by project", () => {
    expect(baseTaskSlug("App Meridian")).toBe("base-app-meridian");
    expect(baseVolumes(env, "abc")).toEqual([
      { service: "db", name: "nex-base-abc-db" },
      { service: "cache", name: "nex-base-abc-cache" },
    ]);
    expect(baseVolumeArgs("abc", { service: "db", name: "nex-base-abc-db" })).toEqual([
      "volume",
      "create",
      "--label",
      "nex=1",
      "--label",
      "nex.base=abc",
      "--label",
      "nex.project=abc",
      "--label",
      "nex.service=db",
      "nex-base-abc-db",
    ]);
  });

  it("runs the task steps before the prepare steps", () => {
    expect(planSteps(env).map((step) => step.label)).toEqual([
      "Start the services",
      "npx prisma migrate deploy",
      "npx prisma db seed",
      "Stop the databases cleanly",
      "Save the clean base",
    ]);
  });

  it("stops the apps first, then the data stores in reverse dependency order", () => {
    expect(stopOrder(env)).toEqual({ apps: ["worker", "web"], stores: ["cache", "db"] });
    const [, , db, cache] = env.services as [
      EnvServiceDef,
      EnvServiceDef,
      EnvServiceDef,
      EnvServiceDef,
    ];
    expect(stopArgs(db, "nex-base-x-db", 180)).toEqual([
      "stop",
      "--time",
      "180",
      "--signal",
      "SIGINT",
      "nex-base-x-db",
    ]);
    expect(stopArgs(cache, "nex-base-x-cache", 180)).toEqual([
      "stop",
      "--time",
      "180",
      "nex-base-x-cache",
    ]);
  });

  it("execs prepare steps through the image’s entrypoint", () => {
    expect(
      prepareExecArgs(
        "nex-base-x-api",
        { entrypoint: ["/entrypoint"], workdir: "/app" },
        "make seed",
      ),
    ).toEqual([
      "exec",
      "--workdir",
      "/app",
      "nex-base-x-api",
      "/entrypoint",
      "sh",
      "-c",
      "make seed",
    ]);
  });

  it("clones into the task’s own data volume with the task’s labels", () => {
    const [db] = clonePlan(baseVolumes(env, "abc"), "abc", "fix-login", {
      "nex-base-abc-db": 1024,
    });
    expect(db).toEqual({
      service: "db",
      source: "nex-base-abc-db",
      target: "nex-fix-login-db-data",
      args: [
        "volume",
        "create",
        "--label",
        "nex=1",
        "--label",
        "nex.task=fix-login",
        "--label",
        "nex.project=abc",
        "--label",
        "nex.service=db",
        "-s",
        "1024",
        "nex-fix-login-db-data",
      ],
    });
  });

  it("summarizes what the services are doing while they start", () => {
    expect(
      startDetail([
        { name: "api", state: "building", detail: "Step 3/9 · RUN uv sync" },
        { name: "db", state: "ready" },
      ]),
    ).toBe("api · Step 3/9 · RUN uv sync");
    expect(
      startDetail([
        { name: "api", state: "starting" },
        { name: "db", state: "ready" },
      ]),
    ).toBe("1 of 2 ready · waiting for api");
  });
});

describe("staleness", () => {
  it("only counts migration files and referenced seeds", () => {
    expect(isMigrationPath("triton/users/migrations/0001_initial.py")).toBe(true);
    expect(isMigrationPath("prisma/migrations/2024_init/migration.sql")).toBe(true);
    expect(isMigrationPath("db/migrate/20240101_create_users.rb")).toBe(true);
    expect(isMigrationPath("alembic/versions/abc_init.py")).toBe(true);
    expect(isMigrationPath("node_modules/pkg/migrations/1.js")).toBe(false);
    expect(isMigrationPath(".venv/lib/django/migrations/0001.py")).toBe(false);
    expect(isMigrationPath("app/migrations/__pycache__/0001.cpython-312.pyc")).toBe(false);
    expect(isMigrationPath("src/app.ts")).toBe(false);
    expect(isMigrationPath("db/seed.sql", ["db/seed.sql"])).toBe(true);
  });

  it("fingerprints paths and contents, whatever the order", () => {
    const a = { path: "m/0001.py", text: "one" };
    const b = { path: "m/0002.py", text: "two" };
    expect(migrationFingerprint([a, b])).toBe(migrationFingerprint([b, a]));
    expect(migrationFingerprint([a, b])).not.toBe(migrationFingerprint([a]));
    expect(migrationFingerprint([a])).not.toBe(migrationFingerprint([{ ...a, text: "changed" }]));
  });

  it("is out of date when main has new migrations or the setup changed", () => {
    const check = { volumesPresent: true, fingerprint: "f1", setupKey: setupKey(env) };
    expect(baseStatus(ready, false, check)).toEqual({ status: "ready" });
    expect(baseStatus(ready, true, check)).toEqual({ status: "building" });
    expect(baseStatus(ready, false, { ...check, fingerprint: "f2" })).toEqual({
      status: "stale",
      stale: "migrations",
    });
    const reseeded = { ...env, prepare: [{ service: "web", command: "npm run seed" }] };
    expect(baseStatus(ready, false, { ...check, setupKey: setupKey(reseeded) })).toEqual({
      status: "stale",
      stale: "setup",
    });
    expect(baseStatus(ready, false, { ...check, volumesPresent: false })).toEqual({
      status: "none",
    });
    expect(baseStatus({ ...ready, status: "failed" }, false, check)).toEqual({ status: "failed" });
    expect(baseStatus(null, false, check)).toEqual({ status: "none" });
  });

  it("ignores app-only changes", () => {
    const moved = {
      ...env,
      services: env.services.map((item) =>
        item.name === "web" ? { ...item, ports: [4000] } : item,
      ),
    };
    expect(setupKey(moved)).toBe(setupKey(env));
  });
});
