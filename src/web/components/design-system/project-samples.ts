import type { ProjectEnvironment } from "@native/db/types";
import type { EnvCheckState } from "@native/environments/types";
import type { ProjectConfig } from "@/components/projects/add-project-dialog";
import type { FoundRepo } from "@/components/projects/repo-picker";

export const FOUND: FoundRepo[] = [
  { name: "atlas", path: "~/Documents/Studio/atlas", branch: "main", active: "today" },
  { name: "atlas-api", path: "~/code/atlas-api", branch: "main", active: "3d ago" },
  { name: "studio-site", path: "~/code/studio-site", branch: "dev", active: "1w ago" },
];

const COMMANDS = ["dev", "test", "lint", "typecheck", "build"];

export function detect(repo: FoundRepo): ProjectConfig {
  return {
    branches: [repo.branch, "develop", "release/2.4"],
    branch: { base: repo.branch, prefix: "feat/", pull: true },
    setup: {
      install: { on: true, command: "yarn install" },
      copy: { on: true, files: [".env"] },
      script: { on: false, path: "" },
    },
    detectedFrom: ["yarn.lock", ".gitignore"],
    commands: COMMANDS.map((name, index) => ({ name, command: `yarn ${name}`, on: index < 2 })),
  };
}

export function detectWithEnvironment(repo: FoundRepo): ProjectConfig {
  const base = detect(repo);
  return {
    ...base,
    setup: { ...base.setup, install: { ...base.setup.install, on: false } },
    commands: base.commands.map((command) => ({ ...command, on: command.name === "test" })),
    environment: SAMPLE_ENVIRONMENT,
  };
}

export const SAMPLE_ENVIRONMENT: ProjectEnvironment = {
  source: "detected",
  detectedFrom: ["docker-compose.yml", "package.json", "yarn.lock"],
  warnings: ["worker: Nex ignores privileged."],
  prepare: [
    {
      service: "db",
      command:
        'psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-${POSTGRES_USER:-postgres}}" -f /nex-project/db/seed.sql',
    },
    { service: "api", command: "python manage.py loaddata fixtures/demo.json" },
  ],
  taskPrepare: [{ service: "api", command: "python manage.py migrate" }],
  services: [
    {
      name: "web",
      kind: "app",
      image: "node:22-alpine",
      command: "corepack enable && yarn install --frozen-lockfile && yarn dev --host 0.0.0.0",
      ports: [5173],
      env: { HOST: "0.0.0.0", VITE_API_URL: "http://api:8000" },
      dependsOn: ["api"],
      ready: { port: 5173 },
      memoryMb: 1024,
    },
    {
      name: "api",
      kind: "build",
      image: "",
      build: { context: "backend", dockerfile: "backend/compose/django/Dockerfile" },
      command: "/start",
      mounts: [{ source: "backend", target: "/app" }],
      volumes: ["/app/.venv"],
      ports: [8000],
      env: { DATABASE_URL: "postgresql://postgres:postgres@db:5432/atlas" },
      envFiles: [".envs/.django"],
      dependsOn: ["db", "redis"],
      ready: { port: 8000 },
      memoryMb: 1024,
    },
    {
      name: "db",
      kind: "image",
      image: "postgres:16-alpine",
      ports: [],
      env: { POSTGRES_PASSWORD: "postgres", POSTGRES_DB: "atlas" },
      data: { path: "/var/lib/postgresql/data" },
      dependsOn: [],
      ready: { command: ["sh", "-c", "pg_isready -h 127.0.0.1 -p 5432"] },
      seed: { file: "db/seed.sql" },
      memoryMb: 512,
    },
    {
      name: "redis",
      kind: "image",
      image: "redis:7-alpine",
      ports: [],
      env: {},
      dependsOn: [],
      ready: { command: ["redis-cli", "ping"] },
      memoryMb: 256,
    },
    {
      name: "worker",
      kind: "build",
      image: "",
      build: { context: "backend", dockerfile: "backend/compose/django/Dockerfile" },
      command: "/start-celeryworker",
      mounts: [{ source: "backend", target: "/app" }],
      volumes: ["/app/.venv"],
      ports: [],
      env: {},
      dependsOn: ["db", "redis"],
      memoryMb: 1024,
    },
  ],
};

const SAMPLE_PATH = "~/code/atlas";

const TESTED_AT = Date.now() - 5 * 60_000;

const checkOf = (
  phase: EnvCheckState["phase"],
  states: EnvCheckState["services"],
  error?: string,
): EnvCheckState => ({
  projectPath: SAMPLE_PATH,
  phase,
  startedAt: TESTED_AT - 90_000,
  ...(phase === "running" ? {} : { finishedAt: TESTED_AT }),
  services: states,
  error,
});

export const SAMPLE_CHECKS: Record<"building" | "running" | "done" | "failed", EnvCheckState> = {
  building: checkOf("running", [
    { name: "api", state: "building", detail: "python-build-stage 4/9 · RUN uv sync --frozen" },
    { name: "worker", state: "building", detail: "python-build-stage 4/9 · RUN uv sync --frozen" },
    { name: "db", state: "waiting" },
    { name: "redis", state: "waiting" },
    { name: "web", state: "waiting" },
  ]),
  running: checkOf("running", [
    { name: "db", state: "ready", detail: "Ready in 2.1s" },
    { name: "redis", state: "ready", detail: "Ready in 0.7s" },
    { name: "api", state: "starting" },
    { name: "web", state: "waiting" },
    { name: "worker", state: "waiting", detail: "Built in 1 min 12s" },
  ]),
  done: checkOf(
    "done",
    ["db", "redis", "api", "web", "worker"].map((name) => ({
      name,
      state: "ready",
      detail: "Ready",
    })),
  ),
  failed: checkOf(
    "failed",
    [
      { name: "db", state: "ready", detail: "Ready in 2.1s" },
      { name: "redis", state: "ready", detail: "Ready in 0.7s" },
      {
        name: "api",
        state: "failed",
        detail: "api stopped: ModuleNotFoundError: No module named 'django'",
      },
      { name: "web", state: "skipped" },
      { name: "worker", state: "skipped" },
    ],
    "api stopped: ModuleNotFoundError: No module named 'django'",
  ),
};

export const SAMPLE_EMPTY_ENVIRONMENT: ProjectEnvironment = {
  services: [],
  source: "detected",
  detectedFrom: [],
  warnings: [],
};
