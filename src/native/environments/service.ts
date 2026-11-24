import { appendFileSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { totalmem } from "os";
import { join } from "path";
import * as settings from "@native/db/repositories/settings.repo";
import { getNexDir } from "@native/paths";
import { type EnvLog } from "./cli";
import {
  checkEnvironments,
  hasOtherContent,
  nexUsage,
  NO_USAGE,
  removeCheckImage,
  removeLegacySetup,
  removeNexResources,
  removeProjectResources,
} from "./containers";
import { NEX_DOMAIN } from "./labels";
import { friendlyError, memoryChoices } from "./parse";
import {
  containerBinary,
  detectRuntime,
  detectSupport,
  downloadRuntime,
  installRuntime,
  runAsAdmin,
  startSystem,
  stopSystem,
  systemRunning,
  uninstallScript,
  verifyPackage,
  type HostSupport,
} from "./runtime";
import {
  completeSetup,
  downloadDetail,
  failStep,
  finishStep,
  newSetup,
  resumeIndex,
  secondsLabel,
  SETUP_STEPS,
  startStep,
  stepDetail,
} from "./setup-steps";
import type { EnvironmentStatus, EnvSetupState, EnvStepId } from "./types";
import { refreshNexAddresses, registerAddressCommands, unregisterAddressCommands } from "./nex-dns";
import { blockedPorts } from "./proxy";

const STATE_KEY = "environments";
const PROGRESS_EVERY_MS = 250;
const LEGACY_DIRS = ["image", "scripts"];
const PASSWORD_DETAIL = "Confirm with your password in the macOS dialog.";

interface StoredState {
  enabled: boolean;
  installedRuntime: boolean;
  pulledCheckImage?: boolean;
}

const envDir = () => join(getNexDir(), "environments");
export const environmentLogPath = () => join(envDir(), "setup.log");

const readState = (): StoredState =>
  settings.get<StoredState>(STATE_KEY, { enabled: false, installedRuntime: false });

export const environmentsEnabled = () => readState().enabled;

const writeState = (patch: Partial<StoredState>) =>
  settings.set(STATE_KEY, { ...readState(), ...patch });

const hostMemoryGb = () => Math.round(totalmem() / 1024 ** 3);

export const log: EnvLog = (line) => {
  try {
    appendFileSync(environmentLogPath(), `${line}\n`);
  } catch {
    mkdirSync(envDir(), { recursive: true });
    appendFileSync(environmentLogPath(), `${line}\n`);
  }
};

const removeDirs = (names: readonly string[]) => {
  for (const name of names) rmSync(join(envDir(), name), { recursive: true, force: true });
};

let support: HostSupport | null = null;
const hostSupport = async () => (support ??= await detectSupport());

let queue: Promise<unknown> = Promise.resolve();
export function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.catch(() => {});
  return next;
}

const listeners = new Set<(state: EnvSetupState) => void>();
let setup: EnvSetupState | null = null;
let running: Promise<EnvSetupState> | null = null;

function publish(next: EnvSetupState) {
  setup = next;
  for (const listener of listeners) listener(next);
}

export function onSetupProgress(listener: (state: EnvSetupState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const latest = () => setup as EnvSetupState;

const addressCommands = () =>
  registerAddressCommands(join(envDir(), "resolver"), containerBinary());

async function registerAddresses(onPrompt: () => void): Promise<void> {
  const commands = await addressCommands();
  onPrompt();
  await runAsAdmin(commands, log);
  if (!refreshNexAddresses()) throw new Error(".nex addresses didn’t register.");
}

type StepRunner = (index: number) => Promise<{ label: string; detail?: string }>;

const STEP_RUNNERS: Record<EnvStepId, StepRunner> = {
  runtime: async (index) => {
    const found = await detectRuntime();
    if (found.compatible) {
      return { label: `Apple container ${found.version} ready`, detail: "Already on this Mac" };
    }
    let lastEmit = 0;
    const pkg = await downloadRuntime(
      join(envDir(), "downloads"),
      (received, total) => {
        const now = Date.now();
        if (now - lastEmit < PROGRESS_EVERY_MS && received < total) return;
        lastEmit = now;
        publish(stepDetail(latest(), index, downloadDetail(received, total)));
      },
      log,
    );
    await verifyPackage(pkg, log);
    publish(stepDetail(latest(), index, PASSWORD_DETAIL));
    const register = refreshNexAddresses() ? [] : await addressCommands().catch(() => []);
    try {
      await installRuntime(pkg, register, log);
    } catch (error) {
      if (!(await detectRuntime()).compatible) throw error;
      log("Apple container installed but .nex addresses didn’t register; the next step retries");
    }
    const installed = await detectRuntime();
    if (!installed.compatible) throw new Error("Apple container didn’t install.");
    writeState({ installedRuntime: true });
    return { label: `Apple container ${installed.version} installed` };
  },
  system: async (index) => {
    if (!(await systemRunning())) await startSystem(log);
    if (!(await systemRunning())) throw new Error("Apple container’s services didn’t start.");
    await removeLegacySetup(log, () =>
      publish(stepDetail(latest(), index, "Removing what an earlier Nex set up")),
    );
    removeDirs(LEGACY_DIRS);
    return { label: "Apple container running" };
  },
  addresses: async (index) => {
    if (refreshNexAddresses()) {
      return { label: ".nex addresses registered", detail: "Already on this Mac" };
    }
    await registerAddresses(() => publish(stepDetail(latest(), index, PASSWORD_DETAIL)));
    return { label: ".nex addresses registered" };
  },
  check: async (index) => {
    const result = await checkEnvironments(log, (detail) =>
      publish(stepDetail(latest(), index, detail)),
    );
    if (result.pulledImage) writeState({ pulledCheckImage: true });
    return {
      label: "A test container ran and answered",
      detail: `${result.address} · started in ${secondsLabel(result.startedMs)}`,
    };
  },
};

const RUNNING_DETAIL: Partial<Record<EnvStepId, string>> = {
  system: "Installs the Linux kernel the first time.",
  check: "Starts a test container and opens its .nex address.",
};

async function runSetup(from: number): Promise<EnvSetupState> {
  for (let index = from; index < SETUP_STEPS.length; index++) {
    const id = SETUP_STEPS[index];
    publish(startStep(latest(), index, RUNNING_DETAIL[id]));
    try {
      const { label, detail } = await STEP_RUNNERS[id](index);
      publish(finishStep(latest(), index, label, detail));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed: ${message}`);
      publish(failStep(latest(), index, friendlyError(message), Date.now()));
      return latest();
    }
  }
  writeState({ enabled: true });
  publish(completeSetup(latest(), Date.now()));
  return latest();
}

export function setupEnvironments(): EnvSetupState {
  if (running && setup) return setup;
  const from = resumeIndex(setup);
  if (from > 0 && setup) {
    publish(startStep(setup, from));
  } else {
    mkdirSync(envDir(), { recursive: true });
    writeFileSync(environmentLogPath(), `Nex environments setup · ${new Date().toISOString()}\n`);
    publish(newSetup(Date.now()));
  }
  running = exclusive(() => runSetup(from)).finally(() => {
    running = null;
  });
  return latest();
}

export async function getEnvironmentStatus(): Promise<EnvironmentStatus> {
  const host = await hostSupport();
  const stored = readState();
  const runtime = host.reason ? null : await detectRuntime();
  const ready = Boolean(runtime?.compatible);
  const up = ready && (await systemRunning());
  const registered = refreshNexAddresses();
  const usage = up ? await nexUsage() : NO_USAGE;
  return {
    supported: host.reason === null,
    reasonUnsupported: host.reason,
    macos: host.macos,
    hostMemoryGb: hostMemoryGb(),
    memoryChoices: memoryChoices(hostMemoryGb()),
    enabled: stored.enabled,
    runtime: {
      installed: runtime?.installed ?? false,
      version: runtime?.version ?? null,
      path: runtime?.path ?? null,
      compatible: ready,
      installedByNex: stored.installedRuntime,
      running: up,
    },
    dns: { domain: NEX_DOMAIN, registered },
    blockedPorts: blockedPorts(),
    usage,
    setup,
  };
}

export async function removeProjectEnvironments(projectPath: string): Promise<void> {
  if (!(await detectRuntime()).installed || !(await systemRunning())) return;
  log(`Removing the environments of ${projectPath}`);
  await removeProjectResources(projectPath, log).catch((error: unknown) =>
    log(`Couldn’t remove them: ${error instanceof Error ? error.message : String(error)}`),
  );
}

export function restartEnvironments(): Promise<void> {
  return exclusive(async () => {
    log("Restarting Apple container");
    if (await systemRunning()) await stopSystem(log);
    await startSystem(log);
  });
}

export function repairAddresses(): Promise<void> {
  return exclusive(async () => {
    log("Repairing .nex addresses");
    if (!refreshNexAddresses()) await registerAddresses(() => {});
  });
}

export function uninstallEnvironments(): Promise<void> {
  return exclusive(async () => {
    log("Removing environments");
    const stored = readState();
    const runtime = await detectRuntime();
    const admin: string[][] = [];
    if (runtime.installed) {
      const wasRunning = await systemRunning();
      if (!wasRunning) await startSystem(log);
      await removeNexResources(log);
      await removeLegacySetup(log);
      if (stored.pulledCheckImage) await removeCheckImage(log);
      if (stored.installedRuntime) {
        const keepData = await hasOtherContent();
        await stopSystem(log);
        admin.push(uninstallScript(!keepData));
      } else if (!wasRunning) {
        await stopSystem(log);
      }
    }
    admin.unshift(...unregisterAddressCommands());
    await runAsAdmin(admin, log);
    refreshNexAddresses();
    writeState({ enabled: false, installedRuntime: false, pulledCheckImage: false });
    setup = null;
    removeDirs([...LEGACY_DIRS, "downloads"]);
  });
}
