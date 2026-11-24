import { useState } from "react";
import { NewTaskDialog } from "@/components/new-task/new-task-dialog";
import type { NewTaskDraft } from "@/hooks/use-task-fields";
import { Composer } from "@/components/composer/composer";
import { HomeHero } from "@/components/home/home-hero";
import { Sidebar } from "@/components/sidebar/sidebar";
import { TaskCard } from "@/components/task/task-card";
import { TaskEmptyState } from "@/components/task/task-empty-state";
import { WORKSPACES } from "@/components/design-system/sidebar-samples";
import { SAMPLE_AGENTS, SAMPLE_PROJECTS } from "@/components/design-system/new-task-samples";
import { SampleHomePrompt } from "@/components/design-system/sample-home-prompt";
import { Section, Specimen } from "@/components/design-system/specimen";

function NewTaskDemo() {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState<NewTaskDraft | null>(null);
  return (
    <div className="relative flex h-[720px] w-full overflow-hidden rounded-card bg-page shadow-card">
      <Sidebar workspaces={WORKSPACES} onNewTask={() => setOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col items-center">
        {started ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <span className="text-sm text-ink-3">
              Started <span className="text-ink">{started.title}</span> on{" "}
              <span className="font-mono text-2xs text-ink-2">{started.branch}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setStarted(null);
                setOpen(true);
              }}
              className="interactive press cursor-pointer text-xs text-accent-ink select-none hover:underline"
            >
              New task again
            </button>
          </div>
        ) : (
          <HomeHero
            phase="night"
            greeting="Good evening"
            prompt={<SampleHomePrompt onStart={setStarted} />}
          />
        )}
      </div>
      {open && (
        <NewTaskDialog
          projects={SAMPLE_PROJECTS}
          agents={SAMPLE_AGENTS}
          onClose={() => setOpen(false)}
          onStart={(draft) => {
            setStarted(draft);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

export function NewTask() {
  return (
    <Section
      id="new-task"
      title="New task"
      description="⌘T opens it over whatever is on screen. The branch name follows the title; ⌘↵ starts the task."
    >
      <Specimen
        name="NewTaskDialog · press New task in the sidebar, or start from the home box"
        bare
      >
        <NewTaskDemo />
      </Specimen>
      <Specimen name="A new task with no messages yet" bare>
        <TaskCard state="focused" className="h-[560px]">
          <TaskEmptyState branch="feat/fix-login" base="main" />
          <Composer placeholder="Describe the task, @ a file, / for commands" state="idle" />
        </TaskCard>
      </Specimen>
    </Section>
  );
}
