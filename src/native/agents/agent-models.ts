import * as settingsRepo from "@native/db/repositories/settings.repo";

export interface AgentModel {
  value: string;
  name: string;
  summary: string;
  efforts: string[];
  autoMode: boolean;
}

interface RawModel {
  value?: unknown;
  resolvedModel?: unknown;
  displayName?: unknown;
  description?: unknown;
  supportsEffort?: unknown;
  supportedEffortLevels?: unknown;
  supportsAutoMode?: unknown;
}

const MODELS_KEY = "agent-models-v2";
const DEFAULT_VALUE = "default";
const WITH = / with /;

const text = (value: unknown) => (typeof value === "string" ? value : "");

function toModel(raw: RawModel, reportsAutoMode: boolean): AgentModel | null {
  const value = text(raw.value);
  if (!value) return null;
  const description = text(raw.description);
  const [first = "", ...rest] = description.split(" · ");
  const namedInDescription = rest.length > 0;
  const headline = (namedInDescription ? first : text(raw.displayName)) || value;
  const name = headline.split(WITH)[0] ?? headline;
  const summary = namedInDescription ? rest.join(" · ") : description;
  const efforts = Array.isArray(raw.supportedEffortLevels)
    ? raw.supportedEffortLevels.filter((level): level is string => typeof level === "string")
    : [];
  return {
    value,
    name: name.trim(),
    summary: summary.trim(),
    efforts: raw.supportsEffort === true ? efforts : [],
    autoMode: reportsAutoMode ? raw.supportsAutoMode === true : true,
  };
}

export function toAgentModels(raw: unknown): AgentModel[] {
  if (!Array.isArray(raw)) return [];
  const models = raw as RawModel[];
  const resolvedByOthers = new Set(
    models.filter((model) => model.value !== DEFAULT_VALUE).map((model) => model.resolvedModel),
  );
  const reportsAutoMode = models.some((model) => typeof model.supportsAutoMode === "boolean");
  const seen = new Set<string>();
  const list: AgentModel[] = [];
  for (const raw of models) {
    if (raw.value === DEFAULT_VALUE && resolvedByOthers.has(raw.resolvedModel)) continue;
    const model = toModel(raw, reportsAutoMode);
    const resolved = text(raw.resolvedModel);
    if (!model || seen.has(model.name) || (resolved && seen.has(resolved))) continue;
    seen.add(model.name);
    if (resolved) seen.add(resolved);
    list.push(model);
  }
  return list;
}

export function rememberAgentModels(models: AgentModel[]): boolean {
  if (models.length === 0) return false;
  const previous = savedAgentModels();
  if (JSON.stringify(previous) === JSON.stringify(models)) return false;
  settingsRepo.set(MODELS_KEY, models);
  return true;
}

export function savedAgentModels(): AgentModel[] {
  return settingsRepo.get<AgentModel[]>(MODELS_KEY, []);
}

export function modelSupportsEffort(model: string): boolean {
  const reported = savedAgentModels().find((item) => item.value === model);
  return !reported || reported.efforts.length > 0;
}
