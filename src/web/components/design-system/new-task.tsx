import { useState } from "react";
import type { AgentOption } from "@/components/new-task/agent-picker";
import { NewTaskDialog, type NewTaskDraft } from "@/components/new-task/new-task-dialog";
import type { NewTaskProject } from "@/components/new-task/place-pickers";
import { Composer } from "@/components/composer/composer";
import { HomeEmpty } from "@/components/home/home-empty";
import { Sidebar } from "@/components/sidebar/sidebar";
import { TaskCard } from "@/components/task/task-card";
import { TaskEmptyState } from "@/components/task/task-empty-state";
import { WORKSPACES } from "@/components/design-system/sidebar-samples";
import { Section, Specimen } from "@/components/design-system/specimen";

const MONOKU = { name: "Monoku", color: "#33843F" };
const PERSONAL = { name: "Personal", color: "#6b21a8" };

const PROJECTS: NewTaskProject[] = [
  { id: "nex", name: "nex", workspace: MONOKU, branches: ["main", "develop", "release/2.4"] },
  { id: "api", name: "api", workspace: MONOKU, branches: ["main", "staging"] },
  { id: "website", name: "website", workspace: MONOKU, branches: ["main"] },
  { id: "dotfiles", name: "dotfiles", workspace: PERSONAL, branches: ["master"] },
];

const AGENTS: AgentOption[] = [
  {
    id: "claude",
    name: "Claude Code",
    detail: "v2.4.1 · detected",
    installed: true,
    accounts: [
      { id: "work", name: "Work", plan: "Max", color: MONOKU.color, usedPercent: 62 },
      { id: "personal", name: "Personal", plan: "Pro", color: PERSONAL.color, usedPercent: 12 },
    ],
  },
  { id: "codex", name: "Codex", detail: "Not installed", installed: false },
  { id: "gemini", name: "Gemini CLI", detail: "Not installed", installed: false },
  { id: "shell", name: "Shell only", detail: "A plain terminal, no agent", installed: true },
];

function NewTaskDemo() {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState<NewTaskDraft | null>(null);
  return (
    <div className="relative flex h-[720px] w-full overflow-hidden rounded-card bg-page shadow-card">
      <Sidebar workspaces={WORKSPACES} />
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
          <HomeEmpty onNewTask={() => setOpen(true)} />
        )}
      </div>
      {open && (
        <NewTaskDialog
          projects={PROJECTS}
          agents={AGENTS}
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
      <Specimen name="NewTaskDialog · press New task, type a title, open each picker" bare>
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
