import { describe, expect, it } from "vite-plus/test";
import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import { toContainerRuns } from "@native/environments/translate";

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

const environment = (services: EnvServiceDef[]): ProjectEnvironment => ({
  services,
  source: "detected",
  detectedFrom: [],
  warnings: [],
});

const TARGET = {
  taskSlug: "fix-login",
  worktreePath: "/Users/me/wt/fix-login",
  projectKey: "shop",
};

const LABELS = (service: string) => [
  "--label",
  "nex=1",
  "--label",
  "nex.task=fix-login",
  "--label",
  "nex.project=shop",
  "--label",
  `nex.service=${service}`,
];

const RUN_LABELS = (service: string) => [
  ...LABELS(service),
  "--kernel-arg",
  "sysctl.fs.inotify.max_user_watches=524288",
  "--kernel-arg",
  "sysctl.fs.inotify.max_user_instances=1024",
];

describe("toContainerRuns", () => {
  const env = environment([
    service({
      name: "web",
      command: "pnpm install && pnpm run dev",
      ports: [5173],
      env: { DATABASE_URL: "postgres://postgres:postgres@db:5432/app" },
      dependsOn: ["db"],
      ready: { port: 5173 },
      memoryMb: 1024,
    }),
    service({
      name: "db",
      kind: "image",
      image: "postgres:16-alpine",
      env: { POSTGRES_PASSWORD: "postgres" },
      data: { path: "/var/lib/postgresql/data" },
      memoryMb: 100,
    }),
  ]);

  it("starts dependencies first, one container per service", () => {
    const plan = toContainerRuns(env, TARGET);
    expect(plan.runs.map((run) => run.name)).toEqual(["nex-fix-login-db", "nex-fix-login-web"]);
  });

  it("runs an image with its data volume, discovery flags and at least 256 MB", () => {
    const [db] = toContainerRuns(env, TARGET).runs;
    expect(db?.args).toEqual([
      "run",
      "--detach",
      "--progress",
      "none",
      "--name",
      "nex-fix-login-db",
      ...RUN_LABELS("db"),
      "--memory",
      "256M",
      "--dns-search",
      "fix-login.nexsvc",
      "--network",
      "default,alias=db.fix-login.nexsvc",
      "--env",
      "PGDATA=/var/lib/postgresql/data/pgdata",
      "--env",
      "POSTGRES_PASSWORD=postgres",
      "--volume",
      "nex-fix-login-db-data:/var/lib/postgresql/data",
      "postgres:16-alpine",
    ]);
  });

  it("runs app code from the worktree, keeping node_modules off the checkout", () => {
    const plan = toContainerRuns(env, TARGET);
    expect(plan.runs[1]?.args).toEqual([
      "run",
      "--detach",
      "--progress",
      "none",
      "--name",
      "nex-fix-login-web",
      ...RUN_LABELS("web"),
      "--memory",
      "1024M",
      "--dns-search",
      "fix-login.nexsvc",
      "--network",
      "default,alias=web.fix-login.nexsvc",
      "--env",
      "COREPACK_ENABLE_DOWNLOAD_PROMPT=0",
      "--env",
      "DATABASE_URL=postgres://postgres:postgres@db:5432/app",
      "--volume",
      "/Users/me/wt/fix-login:/workspace",
      "--volume",
      "nex-fix-login-web-modules:/workspace/node_modules",
      "--workdir",
      "/workspace",
      "--entrypoint",
      "sh",
      "node:22-alpine",
      "-c",
      "pnpm install && pnpm run dev",
    ]);
    expect(plan.volumes.map((volume) => [volume.name, volume.role])).toEqual([
      ["nex-fix-login-db-data", "data"],
      ["nex-fix-login-web-modules", "modules"],
    ]);
    expect(plan.volumes[0]?.args).toEqual([
      "volume",
      "create",
      ...LABELS("db"),
      "nex-fix-login-db-data",
    ]);
  });

  it("labels a check run and splits image commands without a shell", () => {
    const plan = toContainerRuns(
      environment([
        service({
          name: "cache",
          kind: "image",
          image: "redis:7",
          command: "redis-server --appendonly yes",
        }),
        service({
          name: "mysql",
          kind: "image",
          image: "mysql:8.4",
          data: { path: "/var/lib/mysql" },
        }),
        service({ name: "api", image: "python:3.12-slim", workdir: "/workspace/backend" }),
      ]),
      { ...TARGET, check: true },
    );
    const [cache, mysql, api] = plan.runs;
    expect(cache?.args).toContain("nex.check=1");
    expect(cache?.args.slice(-4)).toEqual(["redis:7", "redis-server", "--appendonly", "yes"]);
    expect(mysql?.args.slice(-2)).toEqual(["mysql:8.4", "--datadir=/var/lib/mysql/db"]);
    expect(api?.args.slice(-3)).toEqual(["--workdir", "/workspace/backend", "python:3.12-slim"]);
    expect(plan.volumes.map((volume) => volume.name)).toEqual(["nex-fix-login-mysql-data"]);
  });

  it("reads env files under the service's own values", () => {
    const plan = toContainerRuns(
      environment([
        service({
          name: "db",
          kind: "image",
          image: "postgres:16",
          data: { path: "/var/lib/postgresql/data" },
          env: { POSTGRES_DB: "app" },
          envFiles: [".envs/.postgres"],
        }),
      ]),
      {
        ...TARGET,
        envFiles: {
          ".envs/.postgres": { POSTGRES_DB: "file", PGDATA: "/var/lib/postgresql/data/x" },
        },
      },
    );
    const args = plan.runs[0]?.args ?? [];
    expect(args).toContain("POSTGRES_DB=app");
    expect(args).toContain("PGDATA=/var/lib/postgresql/data/x");
    expect(args).not.toContain("PGDATA=/var/lib/postgresql/data/pgdata");
  });

  it("refuses definitions that can't run", () => {
    expect(() =>
      toContainerRuns(
        environment([
          service({ name: "a", dependsOn: ["b"] }),
          service({ name: "b", dependsOn: ["a"] }),
        ]),
        TARGET,
      ),
    ).toThrow("depend on each other");
    expect(() => toContainerRuns(environment([service({ image: "" })]), TARGET)).toThrow(
      "web needs an image.",
    );
    const built = service({
      kind: "build",
      image: "",
      build: { context: "", dockerfile: "Dockerfile" },
    });
    expect(() => toContainerRuns(environment([built]), TARGET)).toThrow("web isn’t built yet.");
  });

  it("runs built images with compose's mounts, entrypoint and seeded volumes", () => {
    const plan = toContainerRuns(
      environment([
        service({
          name: "django",
          kind: "build",
          image: "",
          build: { context: "triton", dockerfile: "triton/Dockerfile" },
          entrypoint: "/entrypoint --verbose",
          command: "/start",
          mounts: [
            { source: "triton", target: "/app" },
            { source: "triton/config", target: "/app/config", readOnly: true },
          ],
          volumes: ["/app/.venv", "/app/node modules"],
          ports: [8000],
        }),
      ]),
      { ...TARGET, images: { django: "nex-shop-django:abc" } },
    );
    const [django] = plan.runs;
    expect(django?.image).toBe("nex-shop-django:abc");
    expect(django?.args.slice(-13)).toEqual([
      "--volume",
      "/Users/me/wt/fix-login/triton:/app",
      "--volume",
      "/Users/me/wt/fix-login/triton/config:/app/config:ro",
      "--volume",
      "nex-fix-login-django-1:/app/.venv",
      "--volume",
      "nex-fix-login-django-2:/app/node modules",
      "--entrypoint",
      "/entrypoint",
      "nex-shop-django:abc",
      "--verbose",
      "/start",
    ]);
    expect(django?.args).not.toContain("/workspace");
    expect(plan.volumes.map((volume) => [volume.name, volume.role])).toEqual([
      ["nex-fix-login-django-1", "image"],
      ["nex-fix-login-django-2", "image"],
    ]);
    expect(django?.seed).toEqual([
      "run",
      "--rm",
      "--progress",
      "none",
      "--name",
      "nex-fix-login-django-seed",
      ...LABELS("django"),
      "--memory",
      "256M",
      "--user",
      "0:0",
      "--volume",
      "nex-fix-login-django-1:/nex-seed/0",
      "--volume",
      "nex-fix-login-django-2:/nex-seed/1",
      "--entrypoint",
      "sh",
      "nex-shop-django:abc",
      "-c",
      "rm -rf /nex-seed/0/lost+found && if [ -d /app/.venv ]; then cp -a /app/.venv/. /nex-seed/0/; fi && rm -rf /nex-seed/1/lost+found && if [ -d '/app/node modules' ]; then cp -a '/app/node modules'/. /nex-seed/1/; fi",
    ]);
  });

  it("mounts the worktree read-only for seed files, except on app services", () => {
    const plan = toContainerRuns(env, { ...TARGET, mountProject: true });
    const db = plan.runs.find((run) => run.service === "db");
    const web = plan.runs.find((run) => run.service === "web");
    expect(db?.args).toContain("/Users/me/wt/fix-login:/nex-project:ro");
    expect(web?.args).not.toContain("/Users/me/wt/fix-login:/nex-project:ro");
  });
});
