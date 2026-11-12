import { promises as dns } from "dns";
import { cpus, totalmem } from "os";
import { run, runOk, type EnvLog } from "./cli";
import {
  CHECK_LABEL,
  isNex,
  NEX_DOMAIN,
  nexLabels,
  PROJECT_LABEL,
  projectKey,
  TASK_LABEL,
} from "./labels";
import {
  gbFromBytes,
  parseContainers,
  parseIds,
  parseImageNames,
  parseImages,
  parseMemoryUsage,
  parseVolumes,
  type ContainerInfo,
} from "./parse";
import { container, ensureContentStore } from "./runtime";

export const BUILDER_ID = "buildkit";
export const CHECK_IMAGE = "docker.io/library/alpine:3.20";

const CHECK_MEMORY = "256M";
const CONTAINER_DNS = "127.0.0.1:2053";
const LEGACY_MACHINE = "nex";
const LEGACY_IMAGE = "nex-machine";
const PULL_TIMEOUT_MS = 5 * 60_000;
const RUN_TIMEOUT_MS = 2 * 60_000;
const LOOKUP_TRIES = 8;
const LOOKUP_WAIT_MS = 500;

export async function listContainers(): Promise<ContainerInfo[]> {
  const result = await run(container(), ["ls", "--all", "--format", "json"]);
  return result.code === 0 ? parseContainers(result.stdout) : [];
}

async function listVolumes() {
  const result = await run(container(), ["volume", "ls", "--format", "json"]);
  return result.code === 0 ? parseVolumes(result.stdout) : [];
}

async function deleteContainers(ids: readonly string[], log?: EnvLog) {
  if (ids.length > 0) await run(container(), ["delete", "--force", ...ids], { log });
}

export interface NexUsage {
  containers: number;
  running: number;
  usedGb: number;
}

export const NO_USAGE: NexUsage = { containers: 0, running: 0, usedGb: 0 };

export async function nexUsage(): Promise<NexUsage> {
  const nex = (await listContainers()).filter(
    (item) => isNex(item.labels) && !item.labels[CHECK_LABEL],
  );
  const running = nex.filter((item) => item.state === "running").map((item) => item.id);
  if (running.length === 0) return { ...NO_USAGE, containers: nex.length };
  const stats = await run(container(), ["stats", "--no-stream", "--format", "json", ...running]);
  const memory = parseMemoryUsage(stats.stdout);
  const bytes = running.reduce((sum, id) => sum + (memory.get(id) ?? 0), 0);
  return { containers: nex.length, running: running.length, usedGb: gbFromBytes(bytes) };
}

export async function removeNexResources(log: EnvLog): Promise<void> {
  const containers = (await listContainers()).filter((item) => isNex(item.labels));
  await deleteContainers(
    containers.map((item) => item.id),
    log,
  );
  const volumes = (await listVolumes()).filter((item) => isNex(item.labels));
  if (volumes.length > 0) {
    await run(container(), ["volume", "rm", ...volumes.map((item) => item.name)], { log });
  }
}

export async function removeTaskResources(taskSlug: string, log?: EnvLog): Promise<void> {
  const ofTask = (labels: Record<string, string>) =>
    isNex(labels) && labels[TASK_LABEL] === taskSlug;
  const containers = (await listContainers()).filter((item) => ofTask(item.labels));
  await deleteContainers(
    containers.map((item) => item.id),
    log,
  );
  const volumes = (await listVolumes()).filter((item) => ofTask(item.labels));
  if (volumes.length > 0) {
    await run(container(), ["volume", "rm", ...volumes.map((item) => item.name)], { log });
  }
}

export async function removeProjectResources(projectPath: string, log?: EnvLog): Promise<void> {
  const key = projectKey(projectPath);
  const ofProject = (labels: Record<string, string>) =>
    isNex(labels) && labels[PROJECT_LABEL] === key;
  const containers = (await listContainers()).filter((item) => ofProject(item.labels));
  await deleteContainers(
    containers.map((item) => item.id),
    log,
  );
  const volumes = (await listVolumes()).filter((item) => ofProject(item.labels));
  if (volumes.length > 0) {
    await run(container(), ["volume", "rm", ...volumes.map((item) => item.name)], { log });
  }
  const images = await run(container(), ["image", "ls", "--format", "json"]);
  const built =
    images.code === 0 ? parseImages(images.stdout).filter((item) => ofProject(item.labels)) : [];
  if (built.length > 0) {
    await run(container(), ["image", "rm", ...built.map((item) => item.name)], { log });
  }
}

const GIB = 1024 ** 3;

export function builderResources(hostBytes = totalmem(), hostCpus = cpus().length) {
  const memoryGb = Math.min(Math.max(Math.round(hostBytes / GIB / 3), 4), 8);
  return { memoryGb, cpus: Math.min(Math.max(hostCpus - 2, 2), 8) };
}

// Apple's builder defaults to 2 GB and 2 CPUs, which leaves a tsc or webpack build swapping for ages,
// and every `container build` recreates it with its own flags, so they go on each build.
export function builderArgs(): string[] {
  const { memoryGb, cpus } = builderResources();
  return ["--cpus", String(cpus), "--memory", `${memoryGb}g`];
}

export async function inspectContainer(id: string): Promise<ContainerInfo | null> {
  const result = await run(container(), ["inspect", id]);
  return result.code === 0 ? (parseContainers(result.stdout)[0] ?? null) : null;
}

export async function hasOtherContent(): Promise<boolean> {
  const [containers, volumes, machines] = await Promise.all([
    listContainers(),
    listVolumes(),
    run(container(), ["machine", "ls", "--format", "json"]),
  ]);
  return (
    containers.some((item) => !isNex(item.labels) && item.id !== BUILDER_ID) ||
    volumes.some((item) => !isNex(item.labels)) ||
    parseIds(machines.stdout).length > 0
  );
}

export const imageExists = async (reference: string) =>
  (await run(container(), ["image", "inspect", reference])).code === 0;

const LOCAL_REGISTRY = "docker.io/library/";

const sameImage = (a: string, b: string) =>
  a.replace(LOCAL_REGISTRY, "") === b.replace(LOCAL_REGISTRY, "");

export async function removeOtherBuilds(
  tag: string,
  label: string,
  value: string,
  log: EnvLog,
): Promise<void> {
  const result = await run(container(), ["image", "ls", "--format", "json"]);
  if (result.code !== 0) return;
  const stale = parseImages(result.stdout)
    .filter((image) => image.labels[label] === value && !sameImage(image.name, tag))
    .map((image) => image.name);
  if (stale.length > 0) await run(container(), ["image", "rm", ...stale], { log });
}

export const removeCheckImage = (log: EnvLog) =>
  run(container(), ["image", "rm", CHECK_IMAGE], { log });

const isLegacyImage = (name: string) =>
  name.replace(/^docker\.io\/library\//, "").startsWith(`${LEGACY_IMAGE}:`);

export async function removeLegacySetup(log: EnvLog, onFound?: () => void): Promise<void> {
  const [machines, images] = await Promise.all([
    run(container(), ["machine", "ls", "--format", "json"]),
    run(container(), ["image", "ls", "--format", "json"]),
  ]);
  const machine = parseIds(machines.stdout).includes(LEGACY_MACHINE);
  const legacyImages = parseImageNames(images.stdout).filter(isLegacyImage);
  if (!machine && legacyImages.length === 0) return;
  onFound?.();
  log("Removing the Linux machine an earlier Nex set up");
  if (machine) {
    await run(container(), ["machine", "stop", LEGACY_MACHINE], { log, timeoutMs: RUN_TIMEOUT_MS });
    await run(container(), ["machine", "rm", LEGACY_MACHINE], { log, timeoutMs: RUN_TIMEOUT_MS });
  }
  for (const name of legacyImages) await run(container(), ["image", "rm", name], { log });
  if (legacyImages.length > 0) await run(container(), ["builder", "delete", "--force"], { log });
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function resolveFromContainerDns(address: string): Promise<string[]> {
  const resolver = new dns.Resolver({ timeout: 1000, tries: 2 });
  resolver.setServers([CONTAINER_DNS]);
  return resolver.resolve4(address).catch(() => []);
}

async function resolveFromMac(address: string, expected: string): Promise<boolean> {
  for (let attempt = 0; attempt < LOOKUP_TRIES; attempt++) {
    const found = await dns.lookup(address, { family: 4 }).catch(() => null);
    if (found?.address === expected) return true;
    await wait(LOOKUP_WAIT_MS);
  }
  return false;
}

export interface CheckResult {
  address: string;
  startedMs: number;
  pulledImage: boolean;
}

export async function checkEnvironments(
  log: EnvLog,
  onDetail: (detail: string) => void,
): Promise<CheckResult> {
  const stale = (await listContainers()).filter((item) => item.labels[CHECK_LABEL]);
  await deleteContainers(
    stale.map((item) => item.id),
    log,
  );
  const pulledImage = !(await imageExists(CHECK_IMAGE));
  if (pulledImage) {
    onDetail("Downloading a small test image");
    ensureContentStore();
    await runOk(container(), ["image", "pull", CHECK_IMAGE], { log, timeoutMs: PULL_TIMEOUT_MS });
  }
  const name = `nexcheck-${Date.now().toString(36)}`;
  const address = `${name}.check.${NEX_DOMAIN}`;
  onDetail("Starting a test container");
  const started = Date.now();
  await runOk(
    container(),
    [
      "run",
      "--detach",
      "--name",
      name,
      ...nexLabels({ [CHECK_LABEL]: "1" }),
      "--memory",
      CHECK_MEMORY,
      "--network",
      `default,alias=${address}`,
      CHECK_IMAGE,
      "sleep",
      "60",
    ],
    { log, timeoutMs: RUN_TIMEOUT_MS },
  );
  const startedMs = Date.now() - started;
  try {
    onDetail(`Opening ${address}`);
    const inspect = await run(container(), ["inspect", name]);
    const ip = parseContainers(inspect.stdout)[0]?.ip;
    if (!ip) throw new Error("The test container started without an address.");
    log(`Test container ${name} at ${ip}`);
    if (!(await resolveFromContainerDns(address)).includes(ip)) {
      throw new Error("Apple container’s DNS didn’t answer for the test container.");
    }
    if (!(await resolveFromMac(address, ip))) {
      throw new Error(
        ".nex addresses don’t reach containers from this Mac. A VPN or DNS filter can block them.",
      );
    }
  } finally {
    await deleteContainers([name], log);
  }
  return { address, startedMs, pulledImage };
}
