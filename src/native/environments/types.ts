import type { ProjectEnvironment } from "@native/db/types";

export type EnvStepId = "runtime" | "system" | "addresses" | "check";

export type EnvStepState = "pending" | "running" | "done" | "failed";

export interface EnvSetupStep {
  id: EnvStepId;
  label: string;
  detail?: string;
  state: EnvStepState;
}

export interface EnvSetupError {
  title: string;
  detail: string;
}

export interface EnvSetupState {
  phase: "running" | "done" | "failed";
  current: number;
  steps: EnvSetupStep[];
  startedAt: number;
  finishedAt?: number;
  error?: EnvSetupError;
}

export type EnvUnsupportedReason = "macos" | "arch";

export interface EnvironmentStatus {
  supported: boolean;
  reasonUnsupported: EnvUnsupportedReason | null;
  macos: string;
  hostMemoryGb: number;
  memoryChoices: number[];
  enabled: boolean;
  runtime: {
    installed: boolean;
    version: string | null;
    path: string | null;
    compatible: boolean;
    installedByNex: boolean;
    running: boolean;
  };
  dns: {
    domain: string;
    registered: boolean;
  };
  blockedPorts: BlockedPort[];
  usage: {
    containers: number;
    running: number;
    usedGb: number;
  };
  setup: EnvSetupState | null;
}

export type EnvCheckServiceState =
  | "waiting"
  | "building"
  | "pulling"
  | "starting"
  | "ready"
  | "failed"
  | "skipped";

export interface EnvCheckService {
  name: string;
  state: EnvCheckServiceState;
  detail?: string;
  silent?: boolean;
}

export interface EnvCheckState {
  projectPath: string;
  phase: "running" | "done" | "failed";
  services: EnvCheckService[];
  startedAt: number;
  finishedAt?: number;
  error?: string;
}

export interface EnvCheckInput {
  projectPath: string;
  projectName: string;
  environment: ProjectEnvironment;
}

export type TaskEnvStatus =
  | "none"
  | "queued"
  | "starting"
  | "running"
  | "paused"
  | "down"
  | "failed";

export type TaskEnvServiceState = EnvCheckServiceState | "stopped" | "exited";

export interface TaskEnvService {
  name: string;
  state: TaskEnvServiceState;
  detail?: string;
  address: string | null;
  url: string | null;
  localhostUrl: string | null;
  localPort: number | null;
  main: boolean;
  ports: number[];
}

export type BlockedReason = "taken" | "denied";

export interface BlockedPort {
  port: number;
  reason: BlockedReason;
  service?: string;
}

export type TaskEnvStepState = "pending" | "running" | "done" | "failed";

export interface TaskEnvStep {
  service: string;
  command: string;
  state: TaskEnvStepState;
}

export type TaskEnvPause = "idle" | "you" | "restart";

export interface TaskEnvWaiting {
  reason: "count" | "memory";
  running: number;
  max: number;
  usedGb: number;
  budgetGb: number;
  suggestion?: { sessionId: string; title: string };
}

export interface TaskEnvDown {
  service: string;
  code: number | null;
  line: string;
}

export interface TaskEnvState {
  sessionId: string;
  projectId: string;
  slug: string;
  status: TaskEnvStatus;
  services: TaskEnvService[];
  steps: TaskEnvStep[];
  memoryMb: number;
  usedGb: number;
  lastActiveAt: number;
  idle: boolean;
  startedAt?: number;
  readyMs?: number;
  pausedAt?: number;
  pausedReason?: TaskEnvPause;
  idleMinutes?: number;
  down?: TaskEnvDown;
  waiting?: TaskEnvWaiting;
  blockedPorts?: BlockedPort[];
  error?: string;
}

export interface StoredTaskEnv {
  slug: string;
  status: "running" | "paused" | "failed";
  pausedAt?: number;
  pausedReason?: TaskEnvPause;
  idleMinutes?: number;
  readyMs?: number;
  error?: string;
  seeded?: boolean;
}
