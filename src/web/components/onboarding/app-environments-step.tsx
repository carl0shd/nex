import { useState } from "react";
import { EnvironmentsStep, type EnvSetup } from "@/components/onboarding/environments-step";
import { useEnvironments } from "@/hooks/use-environments";
import {
  checkItems,
  envPhase,
  memoryOptions,
  runtimeDetail,
  shownMemory,
  timeLeftLabel,
  tookLabel,
  unsupportedCopy,
} from "@/lib/environments";
import { foundServices } from "@/lib/project-environment";
import { useAddProjectStore } from "@/stores/add-project.store";
import { useEnvironmentsStore } from "@/stores/environments.store";
import { usePreferencesStore } from "@/stores/preferences.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

export function AppEnvironmentsStep({
  projectId,
  onBack,
  onContinue,
}: {
  projectId: string | null;
  onBack: () => void;
  onContinue: () => void;
}) {
  useEnvironments();
  const status = useEnvironmentsStore((s) => s.status);
  const setup = useEnvironmentsStore((s) => s.setup);
  const startSetup = useEnvironmentsStore((s) => s.startSetup);
  const memory = usePreferencesStore((s) => s.prefs.envMemory);
  const setPref = usePreferencesStore((s) => s.setPref);
  const project = useWorkspaceStore((s) => s.projects.find((item) => item.id === projectId));
  const editProject = useAddProjectStore((s) => s.edit);

  const [starting, setStarting] = useState(false);
  const [seenPhase, setSeenPhase] = useState<string | null>(null);

  if (!status) return null;

  const shown = shownMemory(status.memoryChoices, memory);
  const envSetup: EnvSetup = {
    phase: envPhase(status, setup),
    steps: setup ? checkItems(setup.steps) : [],
    current: setup?.current ?? 0,
    leftLabel: setup ? timeLeftLabel(setup) : undefined,
    took: setup ? tookLabel(setup) : undefined,
    failure: setup?.error && { title: setup.error.title, description: setup.error.detail },
    unsupported: status.supported ? undefined : unsupportedCopy(status),
  };
  if (seenPhase !== envSetup.phase) {
    setSeenPhase(envSetup.phase);
    setStarting(false);
  }
  const run = () => {
    setStarting(true);
    if (shown !== memory) setPref("envMemory", shown);
    startSetup();
  };

  return (
    <EnvironmentsStep
      project={project?.name ?? "your project"}
      services={project?.environment ? foundServices(project.environment) : []}
      sources={project?.environment?.detectedFrom.slice(0, 3) ?? []}
      onEditServices={project ? () => editProject(project.id, "environment") : undefined}
      memory={shown}
      memoryOptions={memoryOptions(status.memoryChoices)}
      runtimeDetail={runtimeDetail(status)}
      onMemoryChange={(value) => setPref("envMemory", value)}
      setup={envSetup}
      onBack={onBack}
      onSetUp={run}
      onRetry={run}
      starting={starting}
      onContinue={onContinue}
      onShowLog={() => void window.api.showEnvironmentLog()}
    />
  );
}
