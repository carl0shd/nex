import { useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { AgentLogo } from "@/components/atoms/agent-logo";
import { Shimmer } from "@/components/atoms/shimmer";
import { Spinner } from "@/components/atoms/spinner";
import { StatusDot } from "@/components/atoms/status-dot";
import type { Effort } from "@/components/composer/effort";
import { ModelMenu, type ModelOption } from "@/components/composer/model-menu";
import { PermissionMenu, type PermissionMode } from "@/components/composer/permission-menu";
import { OnboardingStep } from "@/components/onboarding/onboarding-step";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Menu, MenuItem } from "@/components/primitives/menu";
import { PERMISSION_LABEL } from "@/lib/permission-modes";
import { taskBranchName } from "@/lib/task-branch";
import { cn } from "@/lib/utils";

export interface FirstTaskDraft {
  title: string;
  message: string;
}

export interface FirstTaskContext {
  project: string;
  workspace: { name: string; color: string; image?: string | null };
  account: string;
  model?: string;
  mode: string;
  branchPrefix: string;
}

export interface FirstTaskSettings {
  accounts: readonly { id: string; label: string }[];
  account: string;
  onAccount: (id: string) => void;
  models: readonly ModelOption[];
  model: string;
  onModel: (id: string) => void;
  effort: Effort;
  onEffort: (effort: Effort) => void;
  mode: PermissionMode;
  onMode: (mode: PermissionMode) => void;
}

export type FirstTaskProgress = "idle" | "starting" | "started";

type SetupState = "done" | "running" | "pending";

const IDEAS = [
  "Explain how this codebase is organized",
  "Find and fix a failing test",
  "Review my last commit",
];

const SETUP_STATES: Record<FirstTaskProgress, [SetupState, SetupState]> = {
  idle: ["pending", "pending"],
  starting: ["running", "pending"],
  started: ["done", "done"],
};

function IdeaChip({ idea, onPick }: { idea: string; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="interactive press-wide h-7 cursor-pointer rounded-full px-3 text-xs text-ink-3 shadow-[inset_0_0_0_1px_var(--line-strong)] select-none hover:bg-hover hover:text-ink"
    >
      {idea}
    </button>
  );
}

function TaskPill({
  icon,
  strong = false,
  open = false,
  onClick,
  children,
}: {
  icon?: ReactNode;
  strong?: boolean;
  open?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const className = cn(
    "flex h-[26px] min-w-0 items-center gap-1.5 rounded-full px-2.5 text-2xs font-medium",
    icon && "pl-[5px]",
    strong ? "bg-hover-2 text-ink" : "bg-hover text-ink-2",
  );
  if (!onClick) {
    return (
      <span className={className}>
        {icon}
        <span className="truncate">{children}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className={cn(
        className,
        "interactive press cursor-pointer pr-2 select-none hover:text-ink",
        open && "text-ink",
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
      <ChevronDown width={10} height={10} strokeWidth={2.25} className="shrink-0 opacity-70" />
    </button>
  );
}

type Picker = "account" | "model" | "mode";

function TaskSettingsPills({ settings }: { settings: FirstTaskSettings }) {
  const [open, setOpen] = useState<Picker | null>(null);
  const popover = (picker: Picker) => ({
    open: open === picker,
    onOpenChange: (next: boolean) => setOpen(next ? picker : null),
    strategy: "fixed" as const,
  });
  const toggle = (picker: Picker) => () => setOpen(open === picker ? null : picker);
  const account = settings.accounts.find((item) => item.id === settings.account);
  const model = settings.models.find((item) => item.id === settings.model);
  return (
    <>
      <AnchoredPopover
        {...popover("account")}
        trigger={
          <TaskPill
            strong
            icon={<AgentLogo agent="claude" size={16} />}
            open={open === "account"}
            onClick={settings.accounts.length > 1 ? toggle("account") : undefined}
          >
            Claude Code · {account?.label ?? "Claude Code"}
          </TaskPill>
        }
      >
        <Menu width={220}>
          {settings.accounts.map((item) => (
            <MenuItem
              key={item.id}
              checked={item.id === settings.account}
              onSelect={() => {
                settings.onAccount(item.id);
                setOpen(null);
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </AnchoredPopover>
      <AnchoredPopover
        {...popover("model")}
        trigger={
          <TaskPill open={open === "model"} onClick={toggle("model")}>
            {model?.name ?? settings.model}
          </TaskPill>
        }
      >
        <ModelMenu
          models={settings.models}
          model={settings.model}
          onModelChange={settings.onModel}
          effort={settings.effort}
          onEffortChange={settings.onEffort}
        />
      </AnchoredPopover>
      <AnchoredPopover
        {...popover("mode")}
        trigger={
          <TaskPill open={open === "mode"} onClick={toggle("mode")}>
            {PERMISSION_LABEL[settings.mode]}
          </TaskPill>
        }
      >
        <PermissionMenu
          mode={settings.mode}
          onChange={(mode) => {
            settings.onMode(mode);
            setOpen(null);
          }}
        />
      </AnchoredPopover>
    </>
  );
}

function SetupMark({ state }: { state: SetupState }) {
  if (state === "done")
    return (
      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-green-tint text-green">
        <Check width={10} height={10} strokeWidth={3.5} />
      </span>
    );
  if (state === "running") return <Spinner className="mx-0.5 size-3.5" />;
  return (
    <span className="mx-0.5 size-3.5 shrink-0 rounded-full shadow-[inset_0_0_0_1.5px_var(--ring-idle)]" />
  );
}

function SetupRow({ label, meta, state }: { label: string; meta: string; state: SetupState }) {
  return (
    <li
      className={cn(
        "flex h-10 items-center gap-3 rounded-field px-3 transition-colors duration-200",
        state === "running" && "bg-field",
      )}
    >
      <span key={state} className="enter-pop flex">
        <SetupMark state={state} />
      </span>
      <span className={cn("shrink-0 text-sm", state === "pending" ? "text-ink-4" : "text-ink")}>
        {label}
      </span>
      <span className="ml-auto truncate text-2xs text-ink-4">{meta}</span>
    </li>
  );
}

function SetupPreview({
  draft,
  branch,
  context,
  progress,
}: {
  draft: FirstTaskDraft;
  branch: string;
  context: FirstTaskContext;
  progress: FirstTaskProgress;
}) {
  const [worktree, agent] = SETUP_STATES[progress];
  const worktreeName = branch.split("/").pop() ?? branch;
  return (
    <section
      aria-label="Task being created"
      className="w-[600px] overflow-hidden rounded-panel bg-surface shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_35%,transparent),0_2px_4px_rgb(0_0_0/22%),0_24px_48px_-20px_rgb(0_0_0/60%)]"
    >
      <header className="flex h-[58px] items-center gap-2.5 border-b border-line-soft px-[18px]">
        <StatusDot tone={progress === "idle" ? "idle" : "green"} className="size-2" />
        <span className="flex min-w-0 flex-col gap-px">
          <span className="truncate text-base font-medium text-ink">
            {draft.title.trim() || "Untitled task"}
          </span>
          <span className="truncate text-2xs text-ink-4">
            {branch} · {context.project}
          </span>
        </span>
        {progress === "starting" && <Shimmer className="ml-auto text-xs">Setting up…</Shimmer>}
      </header>
      <ol className="m-0 flex list-none flex-col gap-1 p-[18px]">
        <SetupRow label="Create branch" meta={branch} state={worktree} />
        <SetupRow
          label="Create worktree"
          meta={`${context.project}/.worktrees/${worktreeName}`}
          state={worktree}
        />
        <SetupRow
          label="Start Claude Code"
          meta={[context.account, context.model].filter(Boolean).join(" · ")}
          state={agent}
        />
      </ol>
      <div className="mx-[18px] flex flex-col gap-1.5 rounded-menu bg-inset px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--line-soft)]">
        <span className="text-2xs text-ink-4">You</span>
        <span className="text-sm leading-5 text-ink-2">
          {draft.message.trim() || "Your first message shows up here."}
        </span>
      </div>
      <div className="m-[18px] flex h-[42px] items-center rounded-menu bg-field px-3.5 text-sm text-ink-4 shadow-[0_0_0_1px_var(--line)]">
        {progress === "started" ? "Claude is on it" : "Claude starts as soon as setup finishes"}
      </div>
    </section>
  );
}

export function FirstTaskStep({
  draft,
  onChange,
  context,
  settings,
  onBack,
  onSkip,
  onStart,
  progress = "idle",
}: {
  draft: FirstTaskDraft;
  onChange: (draft: FirstTaskDraft) => void;
  context: FirstTaskContext;
  settings?: FirstTaskSettings;
  progress?: FirstTaskProgress;
  onBack?: () => void;
  onSkip?: () => void;
  onStart?: () => void;
}) {
  const prefix = context.branchPrefix.replace(/\/+$/, "");
  const branch = taskBranchName(draft.title, prefix);
  return (
    <OnboardingStep
      step={5}
      title="Start your first task"
      description="Say what you want done. Nex creates the worktree and hands it to Claude with your message."
      onBack={onBack}
      secondary={{ label: "Skip for now", onClick: onSkip }}
      primary={{
        label: progress === "idle" ? "Start task" : "Starting…",
        onClick: onStart,
        disabled: !draft.title.trim() || progress !== "idle",
      }}
      aside={<SetupPreview draft={draft} branch={branch} context={context} progress={progress} />}
    >
      <div className="flex flex-col rounded-panel bg-field shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_55%,transparent),0_0_0_4px_color-mix(in_srgb,var(--accent)_12%,transparent)]">
        <input
          aria-label="Task name"
          value={draft.title}
          autoFocus
          placeholder="Task name"
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          className="h-11 bg-transparent px-3.5 text-md font-medium text-ink outline-none select-text placeholder:text-ink-4"
        />
        <textarea
          aria-label="First message"
          rows={3}
          value={draft.message}
          placeholder="What should Claude do?"
          onChange={(event) => onChange({ ...draft, message: event.target.value })}
          className="resize-none bg-transparent px-3.5 text-sm leading-5 text-ink-2 outline-none select-text placeholder:text-ink-4"
        />
        <div className="flex min-w-0 items-center gap-1.5 p-2.5">
          <TaskPill
            icon={
              <span
                className="ml-[5px] size-1.5 shrink-0 rounded-[2px]"
                style={{ background: context.workspace.color }}
              />
            }
          >
            {context.project}
          </TaskPill>
          {settings ? (
            <TaskSettingsPills settings={settings} />
          ) : (
            <>
              <TaskPill strong icon={<AgentLogo agent="claude" size={16} />}>
                Claude Code · {context.account}
              </TaskPill>
              {context.model && <TaskPill>{context.model}</TaskPill>}
              <TaskPill>{context.mode}</TaskPill>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-ink-4">Or try one of these</span>
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
