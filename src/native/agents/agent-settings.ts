import { cliMode } from "@native/agents/cli-modes";
import * as settingsRepo from "@native/db/repositories/settings.repo";

export { cliMode, modeFromCli } from "@native/agents/cli-modes";

export interface AgentSettings {
  model: string;
  effort: string;
  mode: string;
}

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  model: "opus-5-5",
  effort: "high",
  mode: "manual",
};

const CLI_EFFORT: Record<string, string> = {
  low: "low",
  medium: "medium",
  high: "high",
  xhigh: "xhigh",
  max: "max",
  ultracode: "max",
};

const LEGACY_MODEL = /^(fable|opus|sonnet|haiku)-\d/;

export const cliModel = (model: string) =>
  LEGACY_MODEL.test(model) ? (model.split("-")[0] ?? model) : model;
export const cliEffort = (effort: string) => CLI_EFFORT[effort] ?? "high";

export const ultracodeOn = (settings: AgentSettings) => settings.effort === "ultracode";

export function cliFlags(settings: AgentSettings, supportsEffort = true): string[] {
  return [
    "--model",
    cliModel(settings.model),
    ...(supportsEffort ? ["--effort", cliEffort(settings.effort)] : []),
    "--permission-mode",
    cliMode(settings.mode),
    ...(ultracodeOn(settings) ? ["--settings", JSON.stringify({ ultracode: true })] : []),
  ];
}

const key = (sessionId: string) => `agent-settings:${sessionId}`;

export function readAgentSettings(sessionId: string): AgentSettings {
  return {
    ...DEFAULT_AGENT_SETTINGS,
    ...settingsRepo.get<Partial<AgentSettings>>(key(sessionId), {}),
  };
}

export function saveAgentSettings(sessionId: string, settings: AgentSettings): void {
  settingsRepo.set(key(sessionId), settings);
}
