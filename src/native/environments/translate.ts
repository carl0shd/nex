import { posix } from "path";
import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import {
  clampMemory,
  EnvDefinitionError,
  environmentProblems,
  isNodeImage,
  joinCommand,
  knownImage,
  MIN_MEMORY_MB,
  orderServices,
  searchDomain,
  discoveryAlias,
  splitCommand,
  WORKSPACE_PATH,
} from "./definition";
import { envInstance } from "./instance";
import { CHECK_LABEL, nexLabels, PROJECT_LABEL, SERVICE_LABEL, TASK_LABEL } from "./labels";

// Each container boots its own kernel with only 8k inotify watches, which file watchers in dev
// servers (watchfiles, chokidar) exhaust on a real project.
const KERNEL_ARGS = [
  "--kernel-arg",
  "sysctl.fs.inotify.max_user_watches=524288",
  "--kernel-arg",
  "sysctl.fs.inotify.max_user_instances=1024",
];

export interface RunTarget {
  taskSlug: string;
  worktreePath: string;
  projectKey: string;
  envFiles?: Readonly<Record<string, Readonly<Record<string, string>>>>;
  images?: Readonly<Record<string, string>>;
  check?: boolean;
  mountProject?: boolean;
}

export type VolumeRole = "data" | "modules" | "image";

export interface VolumePlan {
  name: string;
  service: string;
  role: VolumeRole;
  args: string[];
}

export interface ContainerRun {
  service: string;
  name: string;
  image: string;
  aliases: string[];
  ready?: EnvServiceDef["ready"];
  seed?: string[];
  args: string[];
}

export interface ContainerPlan {
  volumes: VolumePlan[];
  runs: ContainerRun[];
}

export const containerName = (taskSlug: string, service: string) =>
  `${envInstance().prefix}-${taskSlug}-${service}`;

export const dataVolumeName = (taskSlug: string, service: string) =>
  `${containerName(taskSlug, service)}-data`;

export const PROJECT_MOUNT = "/nex-project";

const SEED_ROOT = "/nex-seed";

function seedScript(paths: readonly string[]): string {
  return paths
    .map((path, index) => {
      const from = joinCommand([path]);
      const into = `${SEED_ROOT}/${index}`;
      return `rm -rf ${into}/lost+found && if [ -d ${from} ]; then cp -a ${from}/. ${into}/; fi`;
    })
    .join(" && ");
}

function imageEntry(service: EnvServiceDef, image: string, fallback: readonly string[]) {
  const command = service.command?.trim();
  const words = command ? splitCommand(command) : fallback;
  const [entrypoint, ...rest] = service.entrypoint ? splitCommand(service.entrypoint) : [];
  return entrypoint ? ["--entrypoint", entrypoint, image, ...rest, ...words] : [image, ...words];
}

function storeDefaults(service: EnvServiceDef, vars: Readonly<Record<string, string>>) {
  const store = knownImage(service.image)?.store;
  const env: Record<string, string> = {};
  let args: string[] = [];
  if (!service.data) return { env, args };
  // Apple container volumes are ext4 disks with lost+found at the root, which initdb and mysqld refuse.
  if (store === "postgres" && !vars.PGDATA) env.PGDATA = posix.join(service.data.path, "pgdata");
  if ((store === "mysql" || store === "mariadb") && !service.command) {
    args = [`--datadir=${posix.join(service.data.path, "db")}`];
  }
  return { env, args };
}

export function toContainerRuns(env: ProjectEnvironment, target: RunTarget): ContainerPlan {
  const problems = environmentProblems(env);
  if (problems.length > 0) throw new EnvDefinitionError(problems[0]);
  const { taskSlug, worktreePath, projectKey, envFiles = {}, images = {}, check = false } = target;
  const labels = (service: string) =>
    nexLabels({
      [TASK_LABEL]: taskSlug,
      [PROJECT_LABEL]: projectKey,
      [SERVICE_LABEL]: service,
      ...(check ? { [CHECK_LABEL]: "1" } : {}),
    });

  const volumes: VolumePlan[] = [];
  const runs = orderServices(env.services).map((service): ContainerRun => {
    const name = containerName(taskSlug, service.name);
    const aliases = [discoveryAlias(service, taskSlug)];
    const app = service.kind === "app";
    const image = service.kind === "build" ? (images[service.name] ?? "") : service.image;
    if (!image) throw new EnvDefinitionError(`${service.name} isn’t built yet.`);
    const node = app && isNodeImage(image);
    const own = {
      ...Object.assign({}, ...(service.envFiles ?? []).map((file) => envFiles[file] ?? {})),
      ...service.env,
    };
    const defaults = storeDefaults(service, own);
    const vars = {
      ...(node ? { COREPACK_ENABLE_DOWNLOAD_PROMPT: "0" } : {}),
      ...defaults.env,
      ...own,
    };
    const mounts: string[] = [];
    const volume = (role: VolumeRole, path: string, volumeId = `${name}-${role}`) => {
      volumes.push({
        name: volumeId,
        service: service.name,
        role,
        args: ["volume", "create", ...labels(service.name), volumeId],
      });
      mounts.push("--volume", `${volumeId}:${path}`);
      return volumeId;
    };
    const workdir = app ? (service.workdir ?? WORKSPACE_PATH) : service.workdir;
    if (app) mounts.push("--volume", `${worktreePath}:${WORKSPACE_PATH}`);
    for (const mount of app ? [] : (service.mounts ?? [])) {
      const source = posix.join(worktreePath, mount.source);
      mounts.push("--volume", `${source}:${mount.target}${mount.readOnly ? ":ro" : ""}`);
    }
    if (target.mountProject && !app) mounts.push("--volume", `${worktreePath}:${PROJECT_MOUNT}:ro`);
    if (service.data) volume("data", service.data.path, dataVolumeName(taskSlug, service.name));
    if (node && workdir) volume("modules", posix.join(workdir, "node_modules"));
    const kept = app ? [] : (service.volumes ?? []);
    const seeded = kept.map((path, index) => volume("image", path, `${name}-${index + 1}`));
    const seed =
      seeded.length > 0
        ? [
            "run",
            "--rm",
            "--progress",
            "none",
            "--name",
            `${name}-seed`,
            ...labels(service.name),
            "--memory",
            `${MIN_MEMORY_MB}M`,
            "--user",
            "0:0",
            ...seeded.flatMap((volumeId, index) => [
              "--volume",
              `${volumeId}:${SEED_ROOT}/${index}`,
            ]),
            "--entrypoint",
            "sh",
            image,
            "-c",
            seedScript(kept),
          ]
        : undefined;
    const command = service.command?.trim();
    const entry = app
      ? command
        ? ["--entrypoint", "sh", image, "-c", command]
        : [image]
      : imageEntry(service, image, defaults.args);
    return {
      service: service.name,
      name,
      image,
      aliases,
      ready: service.ready,
      ...(seed ? { seed } : {}),
      args: [
        "run",
        "--detach",
        "--progress",
        "none",
        "--name",
        name,
        ...labels(service.name),
        ...KERNEL_ARGS,
        "--memory",
        `${clampMemory(service.memoryMb)}M`,
        "--dns-search",
        searchDomain(taskSlug),
        "--network",
        ["default", ...aliases.map((alias) => `alias=${alias}`)].join(","),
        ...Object.entries(vars).flatMap(([key, value]) => ["--env", `${key}=${value}`]),
        ...mounts,
        ...(workdir ? ["--workdir", workdir] : []),
        ...entry,
      ],
    };
  });
  return { volumes, runs };
}
