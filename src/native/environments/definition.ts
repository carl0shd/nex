import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";

export const WORKSPACE_PATH = "/workspace";
export const MIN_MEMORY_MB = 256;
export const APP_MEMORY_MB = 1536;
export const IMAGE_MEMORY_MB = 256;
export const MEMORY_CHOICES_MB = [256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096];

const ADDRESS_DOMAIN = "nex";
const MAX_NAME = 40;
const NAME = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export type DataStore = "postgres" | "mysql" | "mariadb" | "mongo" | "redis";

export interface KnownImage {
  store: DataStore;
  dataPath: string;
  port: number;
  ready: string[];
  memoryMb: number;
}

const shell = (script: string) => ["sh", "-c", script];

// Each probe goes over TCP: the official images first run a socket-only server while they initialize.
const KNOWN_IMAGES: Record<DataStore, Omit<KnownImage, "store">> = {
  postgres: {
    dataPath: "/var/lib/postgresql/data",
    port: 5432,
    ready: shell("pg_isready -h 127.0.0.1 -p 5432"),
    memoryMb: 384,
  },
  mysql: {
    dataPath: "/var/lib/mysql",
    port: 3306,
    ready: shell("mysqladmin ping -h 127.0.0.1 --silent"),
    memoryMb: 512,
  },
  mariadb: {
    dataPath: "/var/lib/mysql",
    port: 3306,
    ready: shell(
      "mariadb-admin ping -h 127.0.0.1 --silent || mysqladmin ping -h 127.0.0.1 --silent",
    ),
    memoryMb: 512,
  },
  mongo: {
    dataPath: "/data/db",
    port: 27017,
    ready: shell(
      "mongosh --quiet --eval 'db.adminCommand(\"ping\")' || mongo --quiet --eval 'db.adminCommand(\"ping\")'",
    ),
    memoryMb: 512,
  },
  redis: { dataPath: "/data", port: 6379, ready: ["redis-cli", "ping"], memoryMb: 256 },
};

const STORE_NAMES: Record<string, DataStore> = {
  postgres: "postgres",
  postgresql: "postgres",
  postgis: "postgres",
  mysql: "mysql",
  mariadb: "mariadb",
  mongo: "mongo",
  mongodb: "mongo",
  redis: "redis",
};

export function imageRepository(image: string): string {
  const withoutDigest = image.split("@")[0] ?? image;
  const lastSlash = withoutDigest.lastIndexOf("/");
  const colon = withoutDigest.indexOf(":", lastSlash + 1);
  return colon === -1 ? withoutDigest : withoutDigest.slice(0, colon);
}

export function knownImage(image: string): KnownImage | null {
  const name = imageRepository(image).split("/").at(-1) ?? "";
  const store = STORE_NAMES[name.toLowerCase()];
  return store ? { store, ...KNOWN_IMAGES[store] } : null;
}

export const isNodeImage = (image: string) =>
  /^(node|bun)$/.test(imageRepository(image).split("/").at(-1) ?? "");

export function slugName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_NAME)
    .replace(/-+$/, "");
}

export const clampMemory = (memoryMb: number) =>
  Math.max(MIN_MEMORY_MB, Math.round(Number.isFinite(memoryMb) ? memoryMb : MIN_MEMORY_MB));

export function primaryService(env: ProjectEnvironment): EnvServiceDef | undefined {
  return (
    env.services.find((service) => service.kind !== "image" && service.ports.length > 0) ??
    env.services.find((service) => service.ports.length > 0)
  );
}

export function serviceAliases(
  env: ProjectEnvironment,
  service: EnvServiceDef,
  taskSlug: string,
): string[] {
  const own = `${service.name}.${taskSlug}.${ADDRESS_DOMAIN}`;
  return primaryService(env)?.name === service.name
    ? [own, `${taskSlug}.${ADDRESS_DOMAIN}`]
    : [own];
}

export function serviceAddress(
  env: ProjectEnvironment,
  service: EnvServiceDef,
  taskSlug: string,
): string | null {
  if (service.ports.length === 0) return null;
  return serviceAliases(env, service, taskSlug).at(-1) ?? null;
}

export const searchDomain = (taskSlug: string) => `${taskSlug}.${ADDRESS_DOMAIN}`;

export class EnvDefinitionError extends Error {}

export function orderServices(services: readonly EnvServiceDef[]): EnvServiceDef[] {
  const byName = new Map(services.map((service) => [service.name, service]));
  const ordered: EnvServiceDef[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (service: EnvServiceDef, path: string[]) => {
    if (state.get(service.name) === "done") return;
    if (state.get(service.name) === "visiting") {
      const cycle = [...path.slice(path.indexOf(service.name)), service.name];
      throw new EnvDefinitionError(`${cycle.join(" → ")} depend on each other.`);
    }
    state.set(service.name, "visiting");
    for (const dependency of service.dependsOn) {
      const found = byName.get(dependency);
      if (!found) {
        throw new EnvDefinitionError(
          `${service.name} depends on ${dependency}, which isn’t a service.`,
        );
      }
      visit(found, [...path, service.name]);
    }
    state.set(service.name, "done");
    ordered.push(service);
  };
  for (const service of services) visit(service, []);
  return ordered;
}

export function environmentProblems(env: ProjectEnvironment): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const service of env.services) {
    const label = service.name || "A service";
    if (!NAME.test(service.name)) {
      problems.push(`${label} needs a name of lowercase letters, numbers and dashes.`);
    } else if (seen.has(service.name)) {
      problems.push(`Two services are called ${service.name}.`);
    }
    seen.add(service.name);
    if (service.kind === "build") {
      if (!service.build?.dockerfile.trim()) problems.push(`${label} needs a Dockerfile.`);
    } else if (!service.image.trim()) {
      problems.push(`${label} needs an image.`);
    }
    if (service.ports.some((port) => !Number.isInteger(port) || port < 1 || port > 65_535)) {
      problems.push(`${label} has a port outside 1–65535.`);
    }
  }
  for (const step of [...(env.taskPrepare ?? []), ...(env.prepare ?? [])]) {
    if (!seen.has(step.service)) {
      problems.push(
        `A prepare step runs on ${step.service || "no service"}, which isn’t a service.`,
      );
    } else if (!step.command.trim()) {
      problems.push(`A prepare step on ${step.service} has no command.`);
    }
  }
  if (problems.length > 0) return problems;
  try {
    orderServices(env.services);
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  }
  return problems;
}

export function splitCommand(command: string): string[] {
  const words: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let started = false;
  for (let index = 0; index < command.length; index++) {
    const char = command[index] as string;
    if (quote) {
      if (char === quote) quote = null;
      else if (char === "\\" && quote === '"' && index + 1 < command.length)
        current += command[++index];
      else current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (char === "\\" && index + 1 < command.length) {
      current += command[++index];
      started = true;
    } else if (/\s/.test(char)) {
      if (started) words.push(current);
      current = "";
      started = false;
    } else {
      current += char;
      started = true;
    }
  }
  if (started) words.push(current);
  return words;
}

export function joinCommand(words: readonly string[]): string {
  return words
    .map((word) => (/^[\w@%+=:,./-]+$/.test(word) ? word : `'${word.replace(/'/g, `'\\''`)}'`))
    .join(" ");
}
