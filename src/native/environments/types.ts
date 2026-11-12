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

export type CleanBaseStatus = "none" | "building" | "ready" | "stale" | "failed";

export type CleanBaseStale = "migrations" | "setup";

export type CleanBaseStepState = "pending" | "running" | "done" | "failed" | "skipped";

export interface CleanBaseStep {
  label: string;
  code?: boolean;
  detail?: string;
  state: CleanBaseStepState;
}

export interface CleanBaseVolume {
  service: string;
  name: string;
}

export interface CleanBaseRecord {
  status: "building" | "ready" | "failed";
  volumes: CleanBaseVolume[];
  steps: CleanBaseStep[];
  startedAt: number;
  finishedAt?: number;
  builtAt?: number;
  branch?: string;
  commit?: string;
  sizeBytes?: number;
  fingerprint?: string | null;
  setupKey?: string;
  error?: string;
}

export interface CleanBaseState {
  projectId: string;
  projectPath: string;
  status: CleanBaseStatus;
  stale?: CleanBaseStale;
  services: string[];
  steps: CleanBaseStep[];
  startedAt?: number;
  finishedAt?: number;
  builtAt?: number;
  branch?: string;
  commit?: string;
  sizeBytes?: number;
  error?: string;
}

export interface CleanBaseInput {
  projectId: string;
  environment: ProjectEnvironment;
}
