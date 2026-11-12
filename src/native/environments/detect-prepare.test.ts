import { describe, expect, it } from "vite-plus/test";
import type { EnvServiceDef } from "@native/db/types";
import { makefileSeeds, prepareSteps, sqlSeedCommand } from "@native/environments/detect-prepare";
import { memoryFiles } from "@native/environments/project-files";

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

const django = (overrides: Partial<EnvServiceDef>) =>
  service({
    kind: "build",
    image: "",
    build: { context: "api", dockerfile: "api/compose/Dockerfile" },
    ...overrides,
  });

const DOCKERFILE = `FROM python:3.12
COPY ./compose/start /start
COPY ./compose/worker /start-worker
CMD ["/start"]`;

describe("prepareSteps", () => {
  it("migrates Django in every task unless its start script already does", async () => {
    const services = [
      service({
        name: "hocuspocus",
        ports: [1234],
        command: "npm run start",
        kind: "build",
        build: { context: "api", dockerfile: "api/compose/Dockerfile" },
      }),
      django({ name: "django", ports: [8000], command: "/start" }),
      django({ name: "worker", command: "/start-worker" }),
    ];
    const files = {
      "api/manage.py": "",
      "api/compose/Dockerfile": DOCKERFILE,
      "api/compose/worker": "exec celery -A config worker",
    };
    const migrating = await prepareSteps(
      memoryFiles({ ...files, "api/compose/start": "python manage.py migrate\nexec uvicorn app" }),
      services,
    );
    expect(migrating.taskPrepare).toEqual([]);
    const plain = await prepareSteps(
      memoryFiles({ ...files, "api/compose/start": "exec uvicorn app" }),
      services,
    );
    expect(plain.taskPrepare).toEqual([{ service: "django", command: "python manage.py migrate" }]);
    expect(plain.files).toContain("api/manage.py");
  });

  it("finds Rails, Prisma, Alembic and Knex migrations on the app that runs them", async () => {
    const run = async (files: Record<string, string>, command = "npm run dev") =>
      (await prepareSteps(memoryFiles(files), [service({ command, ports: [3000] })])).taskPrepare;
    expect(await run({ "bin/rails": "", Gemfile: "" }, "bin/rails server")).toEqual([
      { service: "web", command: "bin/rails db:migrate" },
    ]);
    expect(await run({ "prisma/schema.prisma": "" })).toEqual([
      { service: "web", command: "npx prisma migrate deploy" },
    ]);
    expect(
      await run({
        "prisma/schema.prisma": "",
        "package.json": JSON.stringify({ scripts: { dev: "prisma migrate deploy && next dev" } }),
      }),
    ).toEqual([]);
    expect(await run({ "alembic.ini": "" }, "uvicorn app:main")).toEqual([
      { service: "web", command: "alembic upgrade head" },
    ]);
    expect(await run({ "knexfile.ts": "" })).toEqual([
      { service: "web", command: "npx knex migrate:latest" },
    ]);
  });

  it("seeds Prisma once, into the base", async () => {
    const found = await prepareSteps(
      memoryFiles({ "prisma/schema.prisma": "", "prisma/seed.ts": "" }),
      [service({ command: "npm run dev" })],
    );
    expect(found.prepare).toEqual([{ service: "web", command: "npx prisma db seed" }]);
  });

  it("loads a SQL seed into the database it belongs to", () => {
    const postgres = service({
      name: "db",
      kind: "image",
      image: "postgres:16",
      seed: { file: "db/seed.sql" },
    });
    expect(sqlSeedCommand(postgres)).toBe(
      'psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-${POSTGRES_USER:-postgres}}" -f /nex-project/db/seed.sql',
    );
    expect(
      sqlSeedCommand(
        service({ name: "db", kind: "image", image: "mysql:8.4", seed: { file: "seed.sql" } }),
      ),
    ).toBe('mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < /nex-project/seed.sql');
    const initDir = {
      ...postgres,
      mounts: [{ source: "db/seed.sql", target: "/docker-entrypoint-initdb.d/seed.sql" }],
    };
    expect(sqlSeedCommand(initDir)).toBeNull();
    expect(sqlSeedCommand({ ...postgres, seed: { file: "prisma/seed.ts" } })).toBeNull();
  });
});

describe("makefileSeeds", () => {
  const MAKEFILE = `.PHONY: db-seed db-reset
db-reset: ## wipe
\t@$(DOCKER_COMP) run --rm api bash -c "python manage.py flush"
db-api-seed: ## Seed
\t@$(DOCKER_COMP) run --rm api bash -c "python manage.py migrate && python manage.py seed --yes"
db-users-seed:
\t@$(DOCKER_COMP) run --rm api python manage.py seed_users $(ARGS)
db-other-seed:
\tdocker compose exec -T db psql -U app -f /seed.sql
\tdocker compose run --rm unknown ./seed
db-seed: db-api-seed db-other-seed`;

  it("reads seed targets that run a command on one of the services", () => {
    expect(makefileSeeds(MAKEFILE, ["api", "db"])).toEqual([
      { service: "api", command: "python manage.py migrate && python manage.py seed --yes" },
      { service: "db", command: "psql -U app -f /seed.sql" },
    ]);
  });
});
