import { useEffect, useMemo } from "react";
import type { ModelOption } from "@/components/composer/model-menu";
import { MODELS, toModelOptions } from "@/components/composer/models";
import { useAgentModelsStore } from "@/stores/agent-models.store";

export function useAgentModels(): readonly ModelOption[] {
  const reported = useAgentModelsStore((s) => s.reported);
  const load = useAgentModelsStore((s) => s.load);
  useEffect(() => load(), [load]);
  return useMemo(() => (reported.length ? toModelOptions(reported) : MODELS), [reported]);
}
