import { describe, expect, it } from "vite-plus/test";
import { detectFromFiles } from "@native/environments/detect";
import {
  publishedPorts,
  dependencies,
  environmentEntries,
  healthcheck,
  memoryMb,
} from "@native/environments/detect-compose";
import { nodeMajor, scriptPort, urlServices } from "@native/environments/detect-stack";
import { memoryFiles } from "@native/environments/project-files";

const DJANGO_COMPOSE = `
services:
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      - POSTGRES_DB=\${POSTGRES_DB:-app}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD:-postgres}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/data]
    command: redis-server --appendonly yes
  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
    ports:
      - "\${BACKEND_PORT:-8000}:8000"
    environment:
      DATABASE_URL: postgresql://postgres:\${POSTGRES_PASSWORD:-postgres}@db:5432/\${POSTGRES_DB:-app}
      DEBUG: 1
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    mem_limit: 2g
  celery_worker:
    build: { context: ., target: development }
    command: celery -A core worker -l info
    volumes: ["./backend:/app"]
    depends_on: [db, redis, ghost]
    privileged: true
volumes:
  postgres_data:
  redis_data:
`;

const DJANGO_DOCKERFILE = `FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONUNBUFFERED=1
FROM base AS development
RUN pip install -r requirements.txt
FROM base AS production
CMD gunicorn core.wsgi`;

const NEXT_COMPOSE = `
services:
  app:
    build:
      context: .
      dockerfile: ./frontend/compose/local/Dockerfile
    ports: ["3000:3000"]
    env_file: [./frontend/.env.development]
    volumes:
      - .:/app
      - /app/frontend/node_modules
    depends_on: [redis]
    command: npm run dev
  storybook:
    profiles: [design]
    build:
      context: .
      dockerfile: ./frontend/compose/local/Dockerfile
    volumes: [".:/app"]
    command: ["npm", "run", "storybook"]
  redis:
    image: redis:7-alpine
`;

const NEXT_DOCKERFILE = `FROM node:18.20-bullseye-slim
WORKDIR /app
RUN corepack enable
WORKDIR /app/frontend
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["pnpm", "run", "dev"]`;

const HOCUSPOCUS_DOCKERFILE = `FROM node:20-alpine AS node
FROM node AS node-build-stage
RUN npm ci
FROM node AS node-run-stage
CMD ["npm", "run", "start"]`;

const MONOREPO_COMPOSE = `
networks:
  meridian:
services:
  postgres:
    image: docker.io/postgres:16-alpine
    container_name: meridian_postgres
    restart: unless-stopped
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $\${POSTGRES_USER}"]
  redis:
    image: docker.io/redis:6-alpine
    networks: [meridian]
  triton-hocuspocus:
    build:
      context: ./triton
      dockerfile: ./compose/local/hocuspocus/Dockerfile
      target: node-run-stage
      args: [NODE_ENV=development]
    image: triton_hocuspocus
    volumes: ["./triton/hocuspocus/src:/app/src:z"]
    environment: [API_URL=http://triton-django:8000]
    ports: ["1234:1234"]
    command: npm run start
  triton-django: &triton-django
    build:
      context: ./triton
      dockerfile: ./compose/local/django/Dockerfile
    stdin_open: true
    tty: true
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
      triton-hocuspocus: { condition: service_started }
    volumes:
      - /app/.venv
      - ./triton:/app:z
      - ./triton/config:/app/config:ro,z
      - media:/app/media
      - ~/.aws:/root/.aws
    environment:
      - DJANGO_SCOUT_BASE_URL=\${DJANGO_SCOUT_BASE_URL:-http://scout-api.local:8008}
    env_file: [./triton/.envs/.local/.django]
    ports: ["8000:8000", "5678:5678"]
    command: /start
    networks:
      meridian:
        aliases: [triton.local]
  triton-celeryworker:
    <<: *triton-django
    entrypoint: ["/entrypoint", "--worker"]
    ports: []
    command: /start-celeryworker
  scout:
    build: https://github.com/acme/scout.git
  oberon:
    build: { context: ./oberon, target: production }
  uploads:
    image: minio/minio
    volumes: [media:/data]
volumes:
  postgres_data:
  media:
`;

describe("compose detection", () => {
  it("maps image and build services, data volumes, seeds and readiness", async () => {
    const env = await detectFromFiles(
      memoryFiles({
        "docker-compose.yml": DJANGO_COMPOSE,
        Dockerfile: DJANGO_DOCKERFILE,
        ".env": "POSTGRES_DB=shop\n",
      }),
    );
    expect(env.detectedFrom).toEqual(["docker-compose.yml", ".env", "Dockerfile"]);
    expect(env.services.map((service) => service.name)).toEqual([
      "db",
      "redis",
      "backend",
      "celery-worker",
    ]);
    const [db, redis, backend, worker] = env.services;
    expect(db).toEqual({
      name: "db",
      kind: "image",
      image: "postgres:15-alpine",
      ports: [],
      env: { POSTGRES_DB: "shop", POSTGRES_PASSWORD: "postgres" },
      data: { path: "/var/lib/postgresql/data" },
      dependsOn: [],
      mounts: [{ source: "db/init.sql", target: "/docker-entrypoint-initdb.d/init.sql" }],
      ready: { command: ["sh", "-c", "pg_isready -U postgres"] },
      seed: { file: "db/init.sql" },
      memoryMb: 384,
    });
    expect(redis).toMatchObject({
      ports: [],
      command: "redis-server --appendonly yes",
      data: { path: "/data" },
      ready: { command: ["redis-cli", "ping"] },
      memoryMb: 256,
    });
    expect(backend).toEqual({
      name: "backend",
      kind: "build",
      image: "",
      build: { context: "", dockerfile: "Dockerfile", target: "development" },
      command: "python manage.py runserver 0.0.0.0:8000",
      mounts: [{ source: "backend", target: "/app" }],
      ports: [8000],
      env: {
        DATABASE_URL: "postgresql://postgres:postgres@db:5432/shop",
        DEBUG: "1",
      },
      dependsOn: ["db", "redis"],
      ready: { port: 8000 },
      memoryMb: 2048,
    });
    expect(worker).toMatchObject({
      kind: "build",
      build: backend?.build,
      ports: [],
      dependsOn: ["db", "redis"],
      mounts: [{ source: "backend", target: "/app" }],
    });
    expect(worker?.ready).toBeUndefined();
    expect(env.warnings).toEqual([
      "celery_worker is called celery-worker in Nex.",
      "celery-worker: Nex ignores privileged.",
      "celery-worker depends on ghost, which isn’t defined.",
    ]);
  });

  it("builds node apps as compose does, keeping the image's node_modules", async () => {
    const env = await detectFromFiles(
      memoryFiles({
        "docker-compose.local.yml": NEXT_COMPOSE,
        "frontend/compose/local/Dockerfile": NEXT_DOCKERFILE,
        "frontend/.env.development": "NEXT_PUBLIC_API=http://api\n",
        "frontend/package.json": JSON.stringify({ scripts: { dev: "next dev" } }),
        "frontend/pnpm-lock.yaml": "",
        "docker-compose.local.override.yml": "services: {}",
      }),
    );
    const [app, storybook, redis] = env.services;
    expect(app).toEqual({
      name: "app",
      kind: "build",
      image: "",
      build: { context: "", dockerfile: "frontend/compose/local/Dockerfile" },
      command: "npm run dev",
      mounts: [{ source: "", target: "/app" }],
      volumes: ["/app/frontend/node_modules"],
      ports: [3000],
      env: {},
      envFiles: ["frontend/.env.development"],
      dependsOn: ["redis"],
      ready: { port: 3000 },
      memoryMb: 1536,
    });
    expect(storybook?.command).toBe("npm run storybook");
    expect(redis?.data).toBeUndefined();
    expect(env.warnings).toContain(
      "Compose only starts storybook with a profile; Nex starts them every time.",
    );
    expect(env.warnings).toContain(
      "docker-compose.local.override.yml isn’t read; edit the services here instead.",
    );
  });

  it("follows YAML merge keys and skips what Nex already does", async () => {
    const env = await detectFromFiles(
      memoryFiles({
        "docker-compose.yml": `
services:
  proxy:
    image: docker.io/traefik:v3
  django: &django
    build: { context: ., dockerfile: compose/django/Dockerfile }
    image: local_django
    env_file: [./.envs/.django, { path: ./.envs/.optional, required: false }, ./.envs/.gone]
    volumes: [".:/app:z"]
    command: /start
  worker:
    <<: *django
    image: local_worker
    command: /start-worker
`,
        "compose/django/Dockerfile":
          "FROM python:3.12\nENV PATH=/venv/bin:$PATH APP=1\nWORKDIR /app",
        ".envs/.django": "SECRET=1",
      }),
    );
    expect(env.services.map((service) => [service.name, service.kind, service.build])).toEqual([
      ["django", "build", { context: "", dockerfile: "compose/django/Dockerfile" }],
      ["worker", "build", { context: "", dockerfile: "compose/django/Dockerfile" }],
    ]);
    expect(env.services[1]).toMatchObject({
      command: "/start-worker",
      env: {},
      envFiles: [".envs/.django"],
      mounts: [{ source: "", target: "/app" }],
    });
    expect(env.warnings).toEqual([
      "Nex gives every service its own address, so proxy isn’t needed.",
      "django: .envs/.gone is missing.",
      "worker: .envs/.gone is missing.",
    ]);
  });

  it("builds multi-stage Dockerfiles as they are", async () => {
    const env = await detectFromFiles(
      memoryFiles({
        "docker-compose.yml": "services:\n  web:\n    build: .\n    ports: ['5173:80']\n",
        Dockerfile: "FROM node:24 AS build\nRUN npm ci\nFROM nginx:alpine\nEXPOSE 80",
        "package.json": JSON.stringify({ scripts: { dev: "vite" } }),
      }),
    );
    expect(env.services[0]).toMatchObject({
      kind: "build",
      build: { context: "", dockerfile: "Dockerfile" },
      ports: [80],
      hostPorts: [{ host: 5173, container: 80 }],
      ready: { port: 80 },
    });
    expect(env.services[0]?.command).toBeUndefined();
    expect(env.warnings).toEqual([]);
  });

  it("keeps compose's mounts, entrypoints and anchors for a monorepo", async () => {
    const env = await detectFromFiles(
      memoryFiles({
        "docker-compose.yml": MONOREPO_COMPOSE,
        "triton/compose/local/hocuspocus/Dockerfile": HOCUSPOCUS_DOCKERFILE,
        "triton/compose/local/django/Dockerfile":
          'FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS python\nFROM python AS python-build-stage\nENTRYPOINT ["/entrypoint"]',
        "triton/.envs/.local/.django": "DJANGO_DEBUG=True",
        "oberon/Dockerfile": "FROM node:24 AS build\nFROM nginx:alpine AS serve",
      }),
    );
    const byName = Object.fromEntries(env.services.map((service) => [service.name, service]));
    expect(Object.keys(byName)).toEqual([
      "postgres",
      "redis",
      "triton-hocuspocus",
      "triton-django",
      "triton-celeryworker",
      "oberon",
      "uploads",
    ]);
    expect(byName["triton-hocuspocus"]).toMatchObject({
      kind: "build",
      build: {
        context: "triton",
        dockerfile: "triton/compose/local/hocuspocus/Dockerfile",
        target: "node-run-stage",
        args: { NODE_ENV: "development" },
      },
      command: "npm run start",
      mounts: [{ source: "triton/hocuspocus/src", target: "/app/src" }],
      env: { API_URL: "http://triton-django:8000" },
      ports: [1234],
    });
    expect(byName["triton-django"]).toMatchObject({
      kind: "build",
      build: { context: "triton", dockerfile: "triton/compose/local/django/Dockerfile" },
      command: "/start",
      mounts: [
        { source: "triton", target: "/app" },
        { source: "triton/config", target: "/app/config", readOnly: true },
      ],
      volumes: ["/app/.venv", "/app/media"],
      envFiles: ["triton/.envs/.local/.django"],
      env: { DJANGO_SCOUT_BASE_URL: "http://scout-api.local:8008" },
      dependsOn: ["postgres", "redis", "triton-hocuspocus"],
      ports: [8000, 5678],
      ready: { port: 8000 },
    });
    expect(byName["triton-celeryworker"]).toMatchObject({
      build: byName["triton-django"]?.build,
      entrypoint: "/entrypoint --worker",
      command: "/start-celeryworker",
      volumes: ["/app/.venv", "/app/media"],
    });
    expect(byName.postgres).toMatchObject({
      kind: "image",
      data: { path: "/var/lib/postgresql/data" },
      ready: { command: ["sh", "-c", "pg_isready -U ${POSTGRES_USER}"] },
    });
    expect(byName.uploads).toMatchObject({ kind: "image", volumes: ["/data"] });
    expect(env.warnings).toEqual([
      "triton-django can’t mount ~/.aws; only project files can be mounted.",
      "triton-celeryworker can’t mount ~/.aws; only project files can be mounted.",
      "scout builds from outside the project, so Nex skips it.",
      "oberon: oberon/Dockerfile has no production stage.",
      "triton-django, triton-celeryworker and uploads each get their own media volume.",
    ]);
  });

  it("reports unset variables and broken YAML", async () => {
    const env = await detectFromFiles(
      memoryFiles({ "compose.yaml": "services:\n  db:\n    image: postgres:${PG_VERSION}\n" }),
    );
    expect(env.services[0]?.image).toBe("postgres:");
    expect(env.warnings).toContain("PG_VERSION isn’t set in .env, so it’s empty.");
    const broken = await detectFromFiles(memoryFiles({ "compose.yaml": "services: [" }));
    expect(broken.services).toEqual([]);
    expect(broken.warnings).toEqual(["compose.yaml couldn’t be read as YAML."]);
  });

  it("reads every compose shape", () => {
    expect(publishedPorts("127.0.0.1:5432:5432/tcp").ports).toEqual([
      { host: 5432, container: 5432 },
    ]);
    expect(publishedPorts(6379).ports).toEqual([{ host: 6379, container: 6379 }]);
    expect(publishedPorts("5173:80").ports).toEqual([{ host: 5173, container: 80 }]);
    expect(publishedPorts("8000-8001:9000-9001").ports).toEqual([
      { host: 8000, container: 9000 },
      { host: 8001, container: 9001 },
    ]);
    expect(publishedPorts("[::1]:8080:80").ports).toEqual([{ host: 8080, container: 80 }]);
    expect(publishedPorts("127.0.0.1::80").ports).toEqual([{ host: 80, container: 80 }]);
    expect(publishedPorts({ target: 80, published: "8080" }).ports).toEqual([
      { host: 8080, container: 80 },
    ]);
    expect(publishedPorts("${PORT}:80")).toEqual({ ports: [], unreadable: "${PORT}:80" });
    expect(memoryMb("512m")).toBe(512);
    expect(memoryMb("1.5g")).toBe(1536);
    expect(memoryMb("bogus")).toBeUndefined();
    expect(environmentEntries(["A=1", "FROM_DOTENV", "MISSING"], { FROM_DOTENV: "x" })).toEqual({
      A: "1",
      FROM_DOTENV: "x",
    });
    expect(environmentEntries({ A: 1, B: null }, { B: "dotenv" })).toEqual({ A: "1", B: "dotenv" });
    expect(dependencies({ db: { condition: "service_healthy" } })).toEqual(["db"]);
    expect(healthcheck({ test: "curl -f http://localhost" })).toEqual([
      "sh",
      "-c",
      "curl -f http://localhost",
    ]);
    expect(healthcheck({ test: ["CMD", "redis-cli", "ping"] })).toEqual(["redis-cli", "ping"]);
    expect(healthcheck({ test: ["NONE"] })).toBeUndefined();
    expect(healthcheck({ test: ["CMD", "x"], disable: true })).toBeUndefined();
  });
});

describe("stack detection", () => {
  it("infers a node app and the databases its URLs point at", async () => {
    const env = await detectFromFiles(
      memoryFiles({
        "package.json": JSON.stringify({ scripts: { dev: "vite", build: "vite build" } }),
        "pnpm-lock.yaml": "",
        ".nvmrc": "v20.11.0\n",
        ".env.example":
          "DATABASE_URL=postgres://shop:secret@localhost:5432/shop\nREDIS_URL=redis://127.0.0.1\n",
        "db/seed.sql": "insert into users values (1);",
      }),
    );
    expect(env.detectedFrom).toEqual([
      "package.json",
      "pnpm-lock.yaml",
      ".nvmrc",
      ".env.example",
      "db/seed.sql",
    ]);
    const [postgres, redis, web] = env.services;
    expect(postgres).toMatchObject({
      name: "postgres",
      image: "postgres:16-alpine",
      env: { POSTGRES_USER: "shop", POSTGRES_PASSWORD: "secret", POSTGRES_DB: "shop" },
      data: { path: "/var/lib/postgresql/data" },
      seed: { file: "db/seed.sql" },
    });
    expect(redis).toMatchObject({ name: "redis", image: "redis:7-alpine", env: {} });
    expect(web).toEqual({
      name: "web",
      kind: "app",
      image: "node:20-alpine",
      command: "corepack enable && pnpm install --frozen-lockfile && pnpm run dev --host 0.0.0.0",
      ports: [5173],
      env: {
        HOST: "0.0.0.0",
        PORT: "5173",
        DATABASE_URL: "postgres://shop:secret@postgres:5432/shop",
        REDIS_URL: "redis://redis:6379",
      },
      dependsOn: ["postgres", "redis"],
      ready: { port: 5173 },
      memoryMb: 1536,
    });
  });

  it("keeps a database host the project already names", () => {
    const found = urlServices({ DATABASE_URL: "mysql://root:pw@mysql-main:3306/app" });
    expect(found.services[0]).toMatchObject({
      name: "mysql-main",
      image: "mysql:8.4",
      env: { MYSQL_ROOT_PASSWORD: "pw", MYSQL_DATABASE: "app" },
    });
    expect(found.appEnv).toEqual({});
  });

  it("runs Procfile lines when there is no dev script", async () => {
    const env = await detectFromFiles(
      memoryFiles({
        Procfile: "web: node server.js\nworker: node worker.js\nrelease: node migrate.js\n",
        "package.json": JSON.stringify({ engines: { node: ">=18" } }),
        "package-lock.json": "{}",
      }),
    );
    expect(env.services.map((service) => [service.name, service.command, service.ports])).toEqual([
      ["web", "npm ci && node server.js", [3000]],
      ["worker", "npm ci && node worker.js", []],
    ]);
    expect(env.services[0]?.image).toBe("node:22-alpine");
    expect(env.warnings).toEqual([]);
  });

  it("leaves the image to pick when a Procfile has no known runtime", async () => {
    const env = await detectFromFiles(memoryFiles({ Procfile: "web: bundle exec rails s\n" }));
    expect(env.services[0]).toMatchObject({ name: "web", image: "" });
    expect(env.warnings).toEqual([]);
  });

  it("leaves desktop apps on the Mac", async () => {
    const env = await detectFromFiles(
      memoryFiles({ "package.json": JSON.stringify({ scripts: { dev: "electron-vite dev" } }) }),
    );
    expect(env.services).toEqual([]);
  });

  it("returns nothing for a stack it doesn't know", async () => {
    expect(await detectFromFiles(memoryFiles({ "main.go": "package main" }))).toEqual({
      services: [],
      source: "detected",
      detectedFrom: [],
      warnings: [],
    });
  });

  it("reads versions and ports modestly", () => {
    expect(nodeMajor("lts/*")).toBe(22);
    expect(nodeMajor("^20.1.0")).toBe(20);
    expect(nodeMajor(">=16")).toBe(22);
    expect(nodeMajor(">=24")).toBe(24);
    expect(scriptPort("next dev -p 4000")).toBe(4000);
    expect(scriptPort("astro dev")).toBe(4321);
    expect(scriptPort("node server.js")).toBeUndefined();
  });
});
