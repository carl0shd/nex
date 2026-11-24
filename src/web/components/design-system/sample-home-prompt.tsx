import { HomePrompt } from "@/components/home/home-prompt";
import { SAMPLE_AGENTS, SAMPLE_PROJECTS } from "@/components/design-system/new-task-samples";
import type { NewTaskDraft } from "@/hooks/use-task-fields";

export function SampleHomePrompt({ onStart }: { onStart?: (draft: NewTaskDraft) => void }) {
  return (
    <HomePrompt
      projects={SAMPLE_PROJECTS}
      agents={SAMPLE_AGENTS}
      onStart={(draft) => {
        onStart?.(draft);
        return Promise.resolve(true);
      }}
    />
  );
}
