import type { EnvUnsupportedReason } from "./types";

const SEMVER = /\d+\.\d+\.\d+/;
const MIN_MACOS = 26;
const GB = 1024 ** 3;
const MEMORY_STEPS = [4, 8, 12, 16] as const;
const MAX_HOST_SHARE = 0.75;

export function compareVersions(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    const diff = (left[index] || 0) - (right[index] || 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}

export function parseVersion(text: string): string | null {
  return text.match(SEMVER)?.[0] ?? null;
}

export function macosMajor(productVersion: string): number {
  return Number.parseInt(productVersion.split(".")[0] ?? "", 10) || 0;
}

export function unsupportedReason(
  macos: string,
  appleSilicon: boolean,
): EnvUnsupportedReason | null {
  if (!appleSilicon) return "arch";
  if (macosMajor(macos) < MIN_MACOS) return "macos";
  return null;
}

const records = (json: string): Record<string, unknown>[] => {
  try {
    const parsed: unknown = JSON.parse(json);
    const list: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    return list.filter(
      (item): item is Record<string, unknown> => Boolean(item) && typeof item === "object",
    );
  } catch {
    return [];
  }
};

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const stringMap = (value: unknown): Record<string, string> =>
  Object.fromEntries(
    Object.entries(object(value)).filter((entry): entry is [string, string] => {
      return typeof entry[1] === "string";
    }),
  );

export interface ContainerInfo {
  id: string;
  state: string;
  labels: Record<string, string>;
  ip: string | null;
  searchDomains: string[];
}

export function parseContainers(json: string): ContainerInfo[] {
  return records(json).map((raw) => {
    const configuration = object(raw.configuration);
    const status = object(raw.status);
    const networks = Array.isArray(status.networks) ? status.networks.map(object) : [];
    const address = networks[0]?.ipv4Address;
    const search = object(configuration.dns).searchDomains;
    return {
      id: String(raw.id ?? configuration.id ?? ""),
      state: typeof status.state === "string" ? status.state : "unknown",
      labels: stringMap(configuration.labels),
      ip: typeof address === "string" && address ? (address.split("/")[0] ?? null) : null,
      searchDomains: Array.isArray(search) ? search.filter((item) => typeof item === "string") : [],
    };
  });
}

export interface VolumeInfo {
  name: string;
  labels: Record<string, string>;
  source: string | null;
  sizeInBytes: number | null;
}

export function parseVolumes(json: string): VolumeInfo[] {
  return records(json).map((raw) => {
    const configuration = object(raw.configuration);
    const size = Number(configuration.sizeInBytes);
    return {
      name: String(configuration.name ?? raw.id ?? ""),
      labels: stringMap(configuration.labels),
      source: typeof configuration.source === "string" ? configuration.source : null,
      sizeInBytes: Number.isFinite(size) && size > 0 ? size : null,
    };
  });
}

export interface ImageConfig {
  entrypoint: string[];
  workdir: string | null;
}

export function parseImageConfig(json: string, architecture = "arm64"): ImageConfig {
  const variants = records(json).flatMap((raw) =>
    Array.isArray(raw.variants) ? raw.variants.map(object) : [],
  );
  const configs = variants.map((variant) => {
    const platform = object(variant.platform);
    return {
      config: object(object(variant.config).config),
      native: platform.os === "linux" && platform.architecture === architecture,
    };
  });
  const config = (configs.find((item) => item.native) ?? configs[0])?.config ?? {};
  return {
    entrypoint: Array.isArray(config.Entrypoint) ? config.Entrypoint.map(String) : [],
    workdir: typeof config.WorkingDir === "string" && config.WorkingDir ? config.WorkingDir : null,
  };
}

export function parseMemoryUsage(json: string): Map<string, number> {
  return new Map(
    records(json).map((raw) => [String(raw.id ?? ""), Number(raw.memoryUsageBytes) || 0]),
  );
}

export function parseImageNames(json: string): string[] {
  return parseImages(json).map((image) => image.name);
}

export interface ImageInfo {
  name: string;
  labels: Record<string, string>;
}

export function parseImages(json: string): ImageInfo[] {
  return records(json).flatMap((raw) => {
    const name = object(raw.configuration).name;
    if (typeof name !== "string") return [];
    const variants = Array.isArray(raw.variants) ? raw.variants.map(object) : [];
    const labels = Object.assign(
      {},
      ...variants.map((variant) => stringMap(object(object(variant.config).config).Labels)),
    ) as Record<string, string>;
    return [{ name, labels }];
  });
}

export const parseIds = (json: string): string[] =>
  records(json)
    .map((raw) => raw.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

export const parseLines = (stdout: string): string[] =>
  stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export function parseSystemRunning(json: string): boolean {
  try {
    return (JSON.parse(json) as { status?: unknown }).status === "running";
  } catch {
    return false;
  }
}

export const gbFromBytes = (bytes: number) => Math.round((bytes / GB) * 10) / 10;

export function memoryChoices(hostGb: number): number[] {
  const fits = MEMORY_STEPS.filter((gb) => gb <= hostGb * MAX_HOST_SHARE);
  return fits.length > 0 ? fits : [MEMORY_STEPS[0]];
}

const appleScriptString = (value: string) =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

const shellQuote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;

export function adminAppleScript(commands: readonly (readonly string[])[]): string {
  const shell = commands.map((command) => command.map(shellQuote).join(" ")).join(" && ");
  return `do shell script ${appleScriptString(shell)} with administrator privileges`;
}

const CANCELLED = /User canceled|\(-128\)/i;

const NS_ERROR = /Error Domain=\S+ Code=-?\d+ "([^"]+)"/;
const LONG_HASH = /\b[0-9a-f]{32,}\b/g;

const MISSING_PATH = /path '(?:.*\/\.worktrees\/[^/]+\/)?([^']+)' does not exist/;

export function friendlyError(raw: string): string {
  if (CANCELLED.test(raw)) return "The password dialog was closed.";
  const missing = MISSING_PATH.exec(raw)?.[1];
  if (missing) return `${missing} isn’t in this task’s files, so it can’t be mounted.`;
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const line = lines.find((item) => /^Error:/i.test(item)) ?? lines[lines.length - 1] ?? "";
  const message = (line.match(NS_ERROR)?.[1] ?? line)
    .replace(/^Error:\s*(unknown:\s*)?/i, "")
    .replace(/^"|"$/g, "")
    .replace(LONG_HASH, (hash) => `${hash.slice(0, 8)}…`);
  if (!message) return "Something went wrong. The log has the details.";
  return message.length > 200 ? `${message.slice(0, 197)}…` : message;
}
