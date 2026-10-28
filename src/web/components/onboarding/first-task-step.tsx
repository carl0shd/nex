import { ShieldCheck } from "iconoir-react";
import { AgentLogo } from "@/components/atoms/agent-logo";
import { Monogram } from "@/components/atoms/entity-chip";
import { Shimmer } from "@/components/atoms/shimmer";
import { StatusDot } from "@/components/atoms/status-dot";
import { TextField } from "@/components/atoms/text-field";
import { FieldPill } from "@/components/new-task/field-pill";
import { CheckList, type CheckItem } from "@/components/onboarding/check-list";
import { OnboardingStep } from "@/components/onboarding/onboarding-step";
import { taskBranchName } from "@/lib/task-branch";

export interface FirstTaskDraft {
  title: string;
  message: string;
}

export interface FirstTaskContext {
  project: string;
  workspace: { name: string; color: string };
  account: string;
  model: string;
  mode: string;
  branchPrefix: string;
}

const IDEAS = [
  "Explain how this codebase is organized",
  "Find and fix a failing test",
  "Review my last commit",
];

function IdeaChip({ idea, onPick }: { idea: string; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="interactive press-wide h-7 cursor-pointer rounded-full px-3 text-xs text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)] select-none hover:bg-hover hover:text-ink"
    >
      {idea}
    </button>
  );
}

function SetupPreview({
  draft,
  branch,
  context,
}: {
  draft: FirstTaskDraft;
  branch: string;
  context: FirstTaskContext;
}) {
  const steps: CheckItem[] = [
    { label: "Created branch", detail: branch, state: "done" },
    { label: "Created worktree", detail: `~/.nex/worktrees/${context.project}/…`, state: "done" },
    { label: "Starting its environment", detail: "from the clean base · 2s", state: "running" },
    {
      label: "Start Claude Code",
      detail: `${context.account} · ${context.model}`,
      state: "pending",
    },
  ];
  return (
    <section
      aria-label="Task being created"
      className="flex flex-col overflow-hidden rounded-sheet bg-surface shadow-[0_0_0_1px_var(--line),0_24px_48px_-20px_rgb(0_0_0/60%)]"
    >
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <StatusDot tone="idle" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-base font-semibold text-ink">
            {draft.title.trim() || "Untitled task"}
          </span>
          <span className="font-mono text-2xs text-ink-4">
            {branch} · {context.project}
          </span>
        </span>
        <Shimmer className="text-xs">Setting up…</Shimmer>
      </header>
      <CheckList items={steps} mono className="px-5 py-3" />
      <div className="mx-5 flex flex-col gap-1.5 rounded-field bg-hover px-3.5 py-3">
        <span className="text-2xs font-medium text-ink-4">You</span>
        <span className="text-sm leading-[19px] text-ink">
          {draft.message.trim() || "Your first message shows up here."}
        </span>
      </div>
      <div className="px-5 pt-3 pb-4 text-xs text-ink-4">
        Claude starts as soon as setup finishes
      </div>
    </section>
  );
}

export function FirstTaskStep({
  draft,
  onChange,
  context,
  onBack,
  onSkip,
  onStart,
}: {
  draft: FirstTaskDraft;
  onChange: (draft: FirstTaskDraft) => void;
  context: FirstTaskContext;
  onBack?: () => void;
  onSkip?: () => void;
  onStart?: () => void;
}) {
  const prefix = context.branchPrefix.replace(/\/+$/, "") || "feat";
  const branch = taskBranchName(draft.title, prefix);
  return (
    <OnboardingStep
      step={6}
      title="Start your first task"
      description="Say what you want done. Nex creates the worktree and hands it to Claude with your message."
      onBack={onBack}
      secondary={{ label: "Skip for now", onClick: onSkip }}
      primary={{ label: "Start task", onClick: onStart, disabled: !draft.title.trim() }}
      aside={<SetupPreview draft={draft} branch={branch} context={context} />}
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Task name"
          value={draft.title}
          autoFocus
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-3">First message</span>
          <textarea
            rows={3}
            value={draft.message}
            onChange={(event) => onChange({ ...draft, message: event.target.value })}
            className="resize-none rounded-field bg-field px-3 py-2.5 text-sm leading-[19px] text-ink shadow-inset-field outline-none transition-shadow duration-150 select-text placeholder:text-ink-4 focus:shadow-focus"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          <FieldPill>
            <Monogram size="sm" color={context.workspace.color}>
              {context.workspace.name[0]}
            </Monogram>
            {context.project}
          </FieldPill>
          <FieldPill>
            <AgentLogo agent="claude" size={16} />
            Claude Code · {context.account}
          </FieldPill>
          <FieldPill>{context.model}</FieldPill>
          <FieldPill>
            <ShieldCheck width={12} height={12} strokeWidth={2} />
            {context.mode}
          </FieldPill>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-ink-3">Or try one of these</span>
        <div className="flex flex-wrap gap-1.5">
          {IDEAS.map((idea) => (
            <IdeaChip
              key={idea}
              idea={idea}
              onPick={() => onChange({ title: idea, message: `${idea}.` })}
            />
          ))}
        </div>
      </div>
    </OnboardingStep>
  );
}
