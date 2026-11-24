import type { EnvPrepareStep, EnvServiceDef } from "@native/db/types";
import { knownImage, slugName, splitCommand, WORKSPACE_PATH } from "./definition";
import { parseDockerfile } from "./dockerfile";
import { repoPath, type ProjectFiles } from "./project-files";
import { PROJECT_MOUNT } from "./translate";

interface Migrator {
  markers: string[];
  command: string;
  migrates: RegExp;
  runs: RegExp;
}

const PYTHON = /\b(python3?|manage\.py|uvicorn|gunicorn|daphne|celery|flask|fastapi)\b/;
const NODE = /\b(node|npm|npx|pnpm|yarn|bun|tsx|next|vite|nest)\b/;

const MIGRATORS: Migrator[] = [
  {
    markers: ["manage.py"],
    command: "python manage.py migrate",
    migrates: /manage\.py\s+migrate\b/,
    runs: PYTHON,
  },
  {
    markers: ["bin/rails"],
    command: "bin/rails db:migrate",
    migrates: /\bdb:(migrate|prepare|setup)\b/,
    runs: /\b(rails|puma|bundle|ruby)\b/,
  },
  {
    markers: ["prisma/schema.prisma"],
    command: "npx prisma migrate deploy",
    migrates: /\bprisma\s+(migrate|db\s+push)\b/,
    runs: NODE,
  },
  {
    markers: ["alembic.ini"],
    command: "alembic upgrade head",
    migrates: /\balembic\s+upgrade\b/,
    runs: PYTHON,
  },
  {
    markers: ["knexfile.js", "knexfile.ts", "knexfile.cjs", "knexfile.mjs"],
    command: "npx knex migrate:latest",
    migrates: /\bknex\s+migrate:/,
    runs: NODE,
  },
  {
    markers: [".sequelizerc"],
    command: "npx sequelize-cli db:migrate",
    migrates: /\bsequelize(-cli)?\s+db:migrate\b/,
    runs: NODE,
  },
];

const PRISMA_SEEDS = ["prisma/seed.ts", "prisma/seed.js", "prisma/seed.mjs"];
const INIT_DIR = "/docker-entrypoint-initdb.d";
const SEED_TARGET = /seed/i;

export interface PrepareSteps {
  prepare: EnvPrepareStep[];
  taskPrepare: EnvPrepareStep[];
  files: string[];
}

const runsCode = (service: EnvServiceDef) => service.kind !== "image";

export function codeRoot(service: EnvServiceDef): string {
  if (service.kind === "build") return repoPath(service.build?.context ?? "");
  const workdir = service.workdir ?? WORKSPACE_PATH;
  return workdir.startsWith(`${WORKSPACE_PATH}/`)
    ? repoPath(workdir.slice(WORKSPACE_PATH.length + 1))
    : "";
}

async function packageScripts(files: ProjectFiles, root: string) {
  const text = await files.read(repoPath(root, "package.json"));
  if (text === null) return null;
  try {
    return JSON.parse(text) as { scripts?: Record<string, string>; prisma?: { seed?: string } };
  } catch {
    return null;
  }
}

export async function startText(files: ProjectFiles, service: EnvServiceDef): Promise<string> {
  const parts = [service.entrypoint ?? "", service.command ?? ""];
  const root = codeRoot(service);
  if (service.kind === "build" && service.build) {
    const dockerfile = await files.read(service.build.dockerfile);
    const parsed = dockerfile === null ? null : parseDockerfile(dockerfile);
    const command = service.command ?? parsed?.cmd ?? "";
    parts.push(command);
    for (const word of splitCommand(command).filter((item) => item.startsWith("/"))) {
      const copy = parsed?.copies.find((item) => item.dest === word);
      for (const source of copy?.sources ?? []) {
        parts.push((await files.read(repoPath(root, source))) ?? "");
      }
    }
  }
  const scripts = (await packageScripts(files, root))?.scripts ?? {};
  const words = new Set(splitCommand(parts.join(" ")));
  for (const [name, script] of Object.entries(scripts)) {
    if (words.has(name)) parts.push(script, scripts[`pre${name}`] ?? "");
  }
  return parts.join("\n");
}

export async function migratesOnStart(
  files: ProjectFiles,
  service: EnvServiceDef,
): Promise<boolean> {
  const text = await startText(files, service);
  return MIGRATORS.some((migrator) => migrator.migrates.test(text));
}

const hasMarker = async (files: ProjectFiles, root: string, markers: readonly string[]) => {
  for (const marker of markers) {
    if ((await files.read(repoPath(root, marker))) !== null) return repoPath(root, marker);
  }
  return null;
};

async function migrationSteps(files: ProjectFiles, services: readonly EnvServiceDef[]) {
  const steps: EnvPrepareStep[] = [];
  const used: string[] = [];
  const byRoot = new Map<string, EnvServiceDef[]>();
  for (const service of services.filter(runsCode)) {
    const root = codeRoot(service);
    byRoot.set(root, [...(byRoot.get(root) ?? []), service]);
  }
  for (const [root, group] of byRoot) {
    const starts = await Promise.all(group.map((service) => startText(files, service)));
    for (const migrator of MIGRATORS) {
      const marker = await hasMarker(files, root, migrator.markers);
      if (!marker) continue;
      used.push(marker);
      if (starts.some((text) => migrator.migrates.test(text))) continue;
      const fits = group.filter((_, index) => migrator.runs.test(starts[index] ?? ""));
      const target = fits.find((service) => service.ports.length > 0) ?? fits[0];
      if (target) steps.push({ service: target.name, command: migrator.command });
    }
  }
  return { steps, used };
}

export function sqlSeedCommand(service: EnvServiceDef): string | null {
  const file = service.seed?.file;
  if (!file?.endsWith(".sql")) return null;
  if ((service.mounts ?? []).some((mount) => mount.target.startsWith(INIT_DIR))) return null;
  const path = `${PROJECT_MOUNT}/${file}`;
  const store = knownImage(service.image)?.store;
  if (store === "postgres") {
    return `psql -v ON_ERROR_STOP=1 -U "\${POSTGRES_USER:-postgres}" -d "\${POSTGRES_DB:-\${POSTGRES_USER:-postgres}}" -f ${path}`;
  }
  if (store === "mysql") return `mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < ${path}`;
  if (store === "mariadb") {
    return `mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE" < ${path}`;
  }
  return null;
}

function unwrapShell(command: string): string {
  const match = /^(?:ba)?sh\s+-c\s+(["'])([\s\S]*)\1$/.exec(command.trim());
  return (match?.[2] ?? command).trim();
}

export function makefileSeeds(text: string, services: readonly string[]): EnvPrepareStep[] {
  const steps: EnvPrepareStep[] = [];
  let target = "";
  for (const line of text.split(/\r?\n/)) {
    const header = /^([A-Za-z0-9_.-]+)\s*:(?!=)/.exec(line);
    if (header) {
      target = header[1] ?? "";
      continue;
    }
    if (!line.startsWith("\t") || !SEED_TARGET.test(target)) continue;
    const call = /\b(?:run|exec)\s+((?:-\S+\s+)*)([a-z0-9][a-z0-9_.-]*)\s+(.+)$/.exec(line.trim());
    if (!call) continue;
    const service = slugName(call[2] ?? "");
    const command = unwrapShell(call[3] ?? "");
    if (!services.includes(service) || /\$[({]/.test(command)) continue;
    if (!steps.some((step) => step.service === service && step.command === command)) {
      steps.push({ service, command });
    }
  }
  return steps;
}

export async function prepareSteps(
  files: ProjectFiles,
  services: readonly EnvServiceDef[],
): Promise<PrepareSteps> {
  const migrations = await migrationSteps(files, services);
  const used = [...migrations.used];
  const prepare: EnvPrepareStep[] = [];
  for (const service of services) {
    const command = sqlSeedCommand(service);
    if (command) prepare.push({ service: service.name, command });
  }
  for (const service of services.filter(runsCode)) {
    const root = codeRoot(service);
    if ((await files.read(repoPath(root, "prisma/schema.prisma"))) === null) continue;
    const pkg = await packageScripts(files, root);
    const seeded =
      Boolean(pkg?.prisma?.seed) || (await hasMarker(files, root, PRISMA_SEEDS)) !== null;
    if (seeded && !prepare.some((step) => step.command === "npx prisma db seed")) {
      prepare.push({ service: service.name, command: "npx prisma db seed" });
    }
  }
  const makefile = await files.read("Makefile");
  if (makefile !== null) {
    const found = makefileSeeds(
      makefile,
      services.map((service) => service.name),
    );
    if (found.length > 0) used.push("Makefile");
    prepare.push(...found);
  }
  return { prepare, taskPrepare: migrations.steps, files: [...new Set(used)] };
}
