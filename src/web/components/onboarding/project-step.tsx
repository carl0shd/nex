import type { ReactNode } from "react";
import { Check, Folder, GitBranch } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { StatusDot, type DotTone } from "@/components/atoms/status-dot";
import { TextField } from "@/components/atoms/text-field";
import { Spinner } from "@/components/atoms/spinner";
import { OnboardingStep } from "@/components/onboarding/onboarding-step";
import { RepoDropZone } from "@/components/projects/repo-picker";
import { taskBranchName } from "@/lib/task-branch";
import { cn } from "@/lib/utils";

export interface ProjectDraft {
  name: string;
  path: string;
  branch: string;
  clean: boolean;
  branchPrefix: string;
  commands: readonly { name: string; on: boolean }[];
}

const EXAMPLE_TASK = "fix login redirect";

const TREES: readonly { branch: string; status: string; tone: DotTone }[] = [
  { branch: "fix-login-redirect", status: "Claude · working", tone: "green" },
  { branch: "usage-panel", status: "Claude · needs you", tone: "orange" },
  { branch: "bump-electron", status: "Done", tone: "idle" },
];

function CommandToggle({
  name,
  on,
  onToggle,
}: {
  name: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        "interactive press flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-3 font-mono text-xs select-none",
        on
          ? "bg-accent-tint text-accent-ink shadow-[inset_0_0_0_1px_var(--green)]"
          : "text-ink-3 shadow-[inset_0_0_0_1px_var(--line-strong)] hover:text-ink-2",
      )}
    >
      {on && <Check width={11} height={11} strokeWidth={3} />}
      {name}
    </button>
  );
}

const PLACEHOLDER: ProjectDraft = {
  name: "your-repo",
  path: "~/code/your-repo",
  branch: "main",
  clean: true,
  branchPrefix: "feat/",
  commands: [],
};

function WorktreeTree({ project }: { project: ProjectDraft }) {
  const prefix = project.branchPrefix.replace(/\/+$/, "") || "feat";
  return (
    <figure
      aria-label="How tasks run"
      className="m-0 flex flex-col gap-5 rounded-sheet bg-surface p-6 shadow-[0_0_0_1px_var(--line),0_24px_48px_-20px_rgb(0_0_0/60%)]"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-field bg-hover text-ink-2">
          <Folder width={16} height={16} strokeWidth={2} />
        </span>
        <span className="flex flex-col">
          <span className="text-base font-medium text-ink">
            {project.name} <span className="text-ink-4">· {project.branch}</span>
          </span>
          <span className="text-2xs text-ink-4">{project.path} · untouched</span>
        </span>
      </div>
      <div className="ml-[18px] flex flex-col gap-2.5 border-l border-line-strong pl-7">
        {TREES.map((tree, index) => (
          <div
            key={tree.branch}
            className="rise-in relative flex items-center gap-3 rounded-field bg-inset px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--line)]"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <span aria-hidden className="absolute top-1/2 -left-7 h-px w-[26px] bg-line-strong" />
            <StatusDot tone={tree.tone} size={7} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-1.5 font-mono text-xs text-ink">
                <GitBranch width={11} height={11} strokeWidth={2} className="text-ink-4" />
                {prefix}/{tree.branch}
              </span>
              <span className="truncate font-mono text-3xs text-ink-4">
                {project.name}/.worktrees/{tree.branch}
              </span>
            </span>
            <span className="shrink-0 text-2xs text-ink-3">{tree.status}</span>
          </div>
        ))}
      </div>
      <figcaption className="text-xs leading-[18px] text-ink-3">
        Your checkout stays as it is. Each task is a separate folder on its own branch, with its own
        agent, terminal and notes.
      </figcaption>
    </figure>
  );
}

export function ProjectStep({
  project,
  onChange,
  onChooseFolder,
  onDropFolder,
  onClone,
  cloning,
  onBack,
  onSkip,
  onAdd,
  reading = false,
  saving = false,
}: {
  cloning?: ReactNode;
  project: ProjectDraft | null;
  onChange: (project: ProjectDraft) => void;
  onChooseFolder?: () => void;
  onDropFolder?: (file: File) => void;
  onClone?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  onAdd?: () => void;
  reading?: boolean;
  saving?: boolean;
}) {
  return (
    <OnboardingStep
      step={3}
      title="Add your first project"
      description="Point Nex at a git repo. Every task gets its own worktree, so agents never step on each other."
      onBack={onBack}
      secondary={onSkip && { label: "Skip for now", onClick: onSkip }}
      primary={{
        label: saving ? "Adding…" : "Add project",
        onClick: onAdd,
        disabled: !project || saving,
      }}
      aside={<WorktreeTree project={project ?? PLACEHOLDER} />}
    >
      {cloning ? (
        cloning
      ) : project ? (
        <PickedProject
          project={project}
          onChange={onChange}
          onChooseFolder={onChooseFolder}
          onClone={onClone}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <RepoDropZone
            onChooseFolder={onChooseFolder}
            onDropFolder={onDropFolder}
            onClone={onClone}
          />
          {reading && (
            <span className="flex items-center gap-2 px-1 text-xs text-ink-3">
              <Spinner className="size-3" />
              Reading the repo…
            </span>
          )}
        </div>
      )}
    </OnboardingStep>
  );
}

function PickedProject({
  project,
  onChange,
  onChooseFolder,
  onClone,
}: {
  project: ProjectDraft;
  onChange: (project: ProjectDraft) => void;
  onChooseFolder?: () => void;
  onClone?: () => void;
}) {
  const prefix = project.branchPrefix.replace(/\/+$/, "") || "feat";
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 rounded-panel bg-surface px-4 py-3 shadow-card">
          <span className="flex size-8 items-center justify-center rounded-control bg-hover text-ink-2">
            <Folder width={15} height={15} strokeWidth={2} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-base font-medium text-ink">{project.name}</span>
            <span className="truncate text-2xs text-ink-4">
              {project.path} · {project.branch} · {project.clean ? "clean" : "uncommitted changes"}
            </span>
          </span>
          <Button size="sm" onClick={onChooseFolder}>
            Change
          </Button>
        </div>
        <div className="flex items-center gap-1 px-1 text-xs text-ink-4">
          <Button variant="quiet" size="xs" onClick={onChooseFolder}>
            Choose another folder
          </Button>
          {onClone && (
            <>
              ·
              <Button variant="quiet" size="xs" onClick={onClone}>
                Clone from GitHub
              </Button>
            </>
          )}
        </div>
      </div>
      <TextField
        label="Branch prefix"
        mono
        value={project.branchPrefix}
        onChange={(event) => onChange({ ...project, branchPrefix: event.target.value })}
        hint={
          <>
            A task called “{EXAMPLE_TASK}” runs on{" "}
            <span className="text-ink-3">{taskBranchName(EXAMPLE_TASK, prefix)}</span>
          </>
        }
      />
      {project.commands.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-ink-3">
            Quick commands <span className="font-normal text-ink-4">· found in package.json</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {project.commands.map((command) => (
              <CommandToggle
                key={command.name}
                name={command.name}
                on={command.on}
                onToggle={() =>
                  onChange({
                    ...project,
                    commands: project.commands.map((item) =>
                      item.name === command.name ? { ...item, on: !item.on } : item,
                    ),
                  })
                }
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
