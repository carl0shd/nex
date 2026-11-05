import type { AgentModel } from "@native/agents/agent-models";
import type { ModelOption } from "@/components/composer/model-menu";

export const MODELS: readonly ModelOption[] = [
  { id: "fable-5-1", name: "Fable 5.1", short: "Fable", tag: "smartest" },
  { id: "opus-5-5", name: "Opus 5.5", short: "Opus", tag: "deep coding" },
  { id: "sonnet-5", name: "Sonnet 5", short: "Sonnet", tag: "everyday" },
  { id: "haiku-4-5", name: "Haiku 4.5", short: "Haiku", tag: "fastest" },
];

export function toModelOptions(reported: readonly AgentModel[]): ModelOption[] {
  return reported.map((model) => ({
    id: model.value,
    name: model.name,
    short: model.name.split(" ")[0] ?? model.name,
    tag: "",
    summary: model.summary,
    efforts: model.efforts,
    autoMode: model.autoMode,
  }));
}

export function resolveModel(models: readonly ModelOption[], id: string): ModelOption | undefined {
  const family = id.split(/[-[]/)[0]?.toLowerCase();
  return (
    models.find((option) => option.id === id) ??
    models.find((option) => option.short.toLowerCase() === family) ??
    models[0]
  );
}
