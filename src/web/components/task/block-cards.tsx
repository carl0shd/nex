import type { ReactNode } from "react";
import {
  Check,
  Clock,
  EditPencil,
  GitPullRequest,
  Map,
  OpenNewWindow,
  TaskList,
  WarningTriangle,
  WifiOff,
} from "iconoir-react";
import { ClaudeTile } from "@/components/atoms/agent-tile";
import { Orbit } from "@/components/atoms/orbit";
import { Shimmer } from "@/components/atoms/shimmer";
import { Spinner } from "@/components/atoms/spinner";
import { DiffCount, type BlockIcon } from "@/components/task/blocks";
import { cn } from "@/lib/utils";

function CardShell({
  ring = "neutral",
  className,
  children,
}: {
  ring?: "neutral" | "waiting" | "plan";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-menu bg-surface-raised",
        ring === "neutral" && "shadow-[0_0_0_1px_var(--line-chip)]",
        ring === "waiting" && "shadow-[0_0_0_1px_var(--ring-waiting)]",
        ring === "plan" && "shadow-[0_0_0_1px_var(--ring-plan)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardHead({
  icon: Icon,
  tone = "muted",
  title,
  meta,
}: {
  icon: BlockIcon;
  tone?: "muted" | "orange" | "blue";
  title: string;
  meta?: string;
}) {
  return (
    <div className="flex items-center gap-[9px]">
      <span
        className={cn(
          "flex w-3.5 shrink-0 justify-center",
          tone === "muted" && "text-ink-3",
          tone === "orange" && "text-orange",
          tone === "blue" && "text-blue",
        )}
      >
        <Icon width={13} height={13} strokeWidth={2} />
      </span>
      <span className="text-sm font-medium text-ink">{title}</span>
      {meta && <span className="ml-auto text-2xs text-ink-4">{meta}</span>}
    </div>
  );
}

export function CardButton({
  children,
  kind = "neutral",
}: {
  children: ReactNode;
  kind?: "primary" | "neutral" | "quiet";
}) {
  return (
    <button
      type="button"
      className={cn(
        "interactive press flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap select-none",
        kind === "primary" && "bg-accent text-on-accent hover:bg-accent-hover",
        kind === "neutral" &&
          "bg-elevated text-ink shadow-[0_0_0_1px_rgb(255_255_255/6%)] hover:bg-control-off",
        kind === "quiet" && "text-ink-3 hover:text-ink-2",
      )}
    >
      {children}
    </button>
  );
}

export type TodoState = "done" | "active" | "todo";

export function TodoPlan({ items }: { items: { label: string; state: TodoState }[] }) {
  const done = items.filter((item) => item.state === "done").length;
  return (
    <CardShell className="gap-2 px-3.5 py-3">
      <CardHead icon={TaskList} title="Plan" meta={`${done} of ${items.length}`} />
      <div className="flex gap-[3px]">
        {items.map((item, i) => (
          <span
            key={i}
            className={cn(
              "h-[3px] flex-1 rounded-full",
              item.state === "done" && "bg-green",
              item.state === "active" && "bg-green/40",
              item.state === "todo" && "bg-hover-2",
            )}
          />
        ))}
      </div>
      <div>
        {items.map((item) => (
          <div key={item.label} className="flex h-[26px] items-center gap-2.5">
            {item.state === "done" && (
              <span className="flex size-3.5 items-center justify-center rounded-full bg-green-tint text-accent-ink">
                <Check width={9} height={9} strokeWidth={3} />
              </span>
            )}
            {item.state === "active" && (
              <span className="flex size-3.5 items-center justify-center">
                <Spinner accent />
              </span>
            )}
            {item.state === "todo" && (
              <span className="size-3.5 rounded-full shadow-[inset_0_0_0_1.5px_var(--ring-idle)]" />
            )}
            <span
              className={cn(
                "text-xs",
                item.state === "done" && "text-ink-4 line-through decoration-ink-6",
                item.state === "active" && "text-ink",
                item.state === "todo" && "text-ink-2",
              )}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

export function SubagentCard({
  name,
  task,
  meta,
  steps,
}: {
  name: string;
  task: string;
  meta: string;
  steps: { icon: BlockIcon; verb: string; target: string; running?: boolean }[];
}) {
  return (
    <CardShell className="gap-1 px-3 py-2.5">
      <div className="flex items-center gap-[9px]">
        <span className="flex size-3.5 shrink-0 items-center justify-center">
          <Orbit size="md" />
        </span>
        <span className="text-sm font-medium text-ink">{name}</span>
        <span className="truncate text-xs text-ink-3">{task}</span>
        <span className="ml-auto shrink-0 text-2xs text-ink-4">{meta}</span>
      </div>
      <div className="ml-[23px]">
        {steps.map(({ icon: Icon, verb, target, running }) => (
          <div key={target} className="flex h-[22px] items-center gap-2 text-xs">
            {running ? (
              <Spinner />
            ) : (
              <span className="flex w-3.5 shrink-0 justify-center text-ink-4">
                <Icon width={12} height={12} strokeWidth={2} />
              </span>
            )}
            {running ? (
              <Shimmer className="font-medium">{verb}</Shimmer>
            ) : (
              <span className="font-medium text-ink-2">{verb}</span>
            )}
            <span className="font-mono text-2xs text-ink-3">{target}</span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

export function ParallelAgents({
  agents,
}: {
  agents: { name: string; task: string; meta: string; done: boolean }[];
}) {
  return (
    <div className="-mt-0.5 mb-1 ml-[23px]">
      {agents.map((agent) => (
        <div key={agent.task} className="flex h-[26px] items-center gap-[9px] text-xs">
          {agent.done ? (
            <span className="flex w-3 text-accent-ink">
              <Check width={11} height={11} strokeWidth={2.5} />
            </span>
          ) : (
            <Spinner />
          )}
          <span className="font-medium text-ink">{agent.name}</span>
          <span className="text-ink-3">{agent.task}</span>
          <span className="ml-auto text-2xs text-ink-4">{agent.meta}</span>
        </div>
      ))}
    </div>
  );
}

export function PlanApproval({ title, steps }: { title: string; steps: string[] }) {
  return (
    <CardShell ring="plan" className="gap-2.5 px-3.5 py-3">
      <CardHead icon={Map} tone="blue" title="Plan ready" meta="plan mode" />
      <div className="text-xs leading-[19px] text-ink-2">
        <span className="mb-1 block font-medium text-ink">{title}</span>
        {steps.map((step, i) => (
          <span key={step} className="block">
            {i + 1}. {step}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <CardButton kind="primary">Approve plan</CardButton>
        <CardButton>Keep planning</CardButton>
        <span className="ml-auto text-2xs text-ink-4">or reply to change it</span>
      </div>
    </CardShell>
  );
}

export function PullRequestCard({
  title,
  number,
  branch,
  files,
  diff,
}: {
  title: string;
  number: number;
  branch: string;
  files: number;
  diff: { added: number; removed: number };
}) {
  return (
    <CardShell className="px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-control bg-green-tint text-accent-ink">
          <GitPullRequest width={14} height={14} strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-ink">
            {title} <span className="font-normal text-ink-4">#{number}</span>
          </span>
          <span className="text-2xs text-ink-4">
            <span className="font-mono">{branch}</span> → main · {files} files{" "}
            <DiffCount {...diff} />
          </span>
        </span>
        <span className="ml-auto">
          <CardButton>
            <OpenNewWindow width={11} height={11} strokeWidth={2} />
            Open
          </CardButton>
        </span>
      </div>
    </CardShell>
  );
}

export function UsageLimitCard({
  resets,
  body,
  account,
}: {
  resets: string;
  body: string;
  account: string;
}) {
  return (
    <CardShell ring="waiting" className="gap-2.5 px-3.5 py-3">
      <CardHead
        icon={Clock}
        tone="orange"
        title="Session limit reached"
        meta={`resets ${resets}`}
      />
      <span className="text-xs text-ink-3">{body}</span>
      <div className="flex gap-1.5">
        <CardButton>
          <ClaudeTile size={16} />
          Continue on {account}
        </CardButton>
        <CardButton kind="quiet">Notify me at reset</CardButton>
      </div>
    </CardShell>
  );
}

export function TurnSummary({
  files,
  diff,
}: {
  files: number;
  diff: { added: number; removed: number };
}) {
  return (
    <div className="flex h-[34px] items-center gap-2.5 rounded-field px-2.5 shadow-[inset_0_0_0_1px_var(--line)]">
      <span className="flex w-3.5 shrink-0 justify-center text-ink-3">
        <EditPencil width={13} height={13} strokeWidth={2} />
      </span>
      <span className="text-xs text-ink-2">Changed {files} files</span>
      <DiffCount {...diff} />
      <button
        type="button"
        className="interactive press ml-auto cursor-pointer text-xs text-accent-ink select-none hover:underline"
      >
        View changes →
      </button>
    </div>
  );
}

export function SystemDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[30px] items-center gap-2.5 text-2xs text-ink-4">
      <span className="h-px flex-1 bg-line-chip" />
      {children}
      <span className="h-px flex-1 bg-line-chip" />
    </div>
  );
}

type SystemKind = "offline" | "crashed" | "ended";

const SYSTEM: Record<SystemKind, { icon: BlockIcon; tone: string }> = {
  offline: { icon: WifiOff, tone: "text-orange" },
  crashed: { icon: WarningTriangle, tone: "text-red" },
  ended: { icon: Clock, tone: "text-ink-3" },
};

export function SystemRow({
  kind,
  title,
  description,
  actions,
}: {
  kind: SystemKind;
  title: string;
  description: string;
  actions: { label: string; primary?: boolean }[];
}) {
  const { icon: Icon, tone } = SYSTEM[kind];
  return (
    <div className="flex items-start gap-2.5 px-0.5 py-1">
      <span className={cn("flex pt-0.5", tone)}>
        <Icon width={15} height={15} strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">{title}</span>
        <span className="text-xs text-ink-3">{description}</span>
      </span>
      <span className="ml-auto flex shrink-0 gap-3.5 pt-px">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={cn(
              "interactive press h-[22px] cursor-pointer text-xs font-medium whitespace-nowrap select-none",
              action.primary
                ? "text-accent-ink hover:text-accent-hover"
                : "text-ink-3 hover:text-ink-2",
            )}
          >
            {action.label}
          </button>
        ))}
      </span>
    </div>
  );
}
