import { RotateCw } from "lucide-react";
import { ClaudeTile } from "@/components/atoms/agent-tile";
import { IconButton } from "@/components/atoms/icon-button";
import { Kbd } from "@/components/atoms/kbd";
import { StatusDot, type DotTone } from "@/components/atoms/status-dot";
import GlideMenu from "@/components/primitives/glide-menu";
import { AccountSwitch, type UsageAccount } from "@/components/usage/account-switch";
import { SessionLimit, type SessionWindow } from "@/components/usage/session-limit";
import { SpendTrend, type DailySpend } from "@/components/usage/spend-trend";
import { shortcutLabel } from "@/lib/app-shortcuts";

export type UsageTaskStatus = "running" | "waiting" | "idle";

export interface UsageTask {
  id: string;
  title: string;
  project: string;
  status: UsageTaskStatus;
  cost: string;
}

const STATUS_TONE: Record<UsageTaskStatus, DotTone> = {
  running: "green",
  waiting: "orange",
  idle: "idle",
};

function UsageTaskRow({ task, onOpen }: { task: UsageTask; onOpen?: (id: string) => void }) {
  return (
    <button
      type="button"
      data-menu-row
      onClick={() => onOpen?.(task.id)}
      className="interactive press-wide relative flex h-[30px] cursor-pointer items-center gap-[9px] rounded-control px-2.5 text-left select-none"
    >
      <StatusDot tone={STATUS_TONE[task.status]} />
      <span className="truncate text-xs text-ink">{task.title}</span>
      <span className="shrink-0 font-mono text-3xs text-ink-4">{task.project}</span>
      <span className="ml-auto shrink-0 text-xs text-ink-2 tabular-nums">{task.cost}</span>
    </button>
  );
}

export function UsagePanel({
  accounts,
  account,
  onAccountChange,
  updated,
  onRefresh,
  session,
  switchTo,
  onSwitch,
  spend,
  tasks,
  onOpenTask,
  summary,
  onDetails,
}: {
  accounts: readonly UsageAccount[];
  account: string;
  onAccountChange: (id: string) => void;
  updated: string;
  onRefresh?: () => void;
  session: SessionWindow;
  switchTo?: string;
  onSwitch?: () => void;
  spend: DailySpend;
  tasks: readonly UsageTask[];
  onOpenTask?: (id: string) => void;
  summary: string;
  onDetails?: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Usage"
      className="enter-pop w-[400px] overflow-hidden rounded-panel bg-glass shadow-modal backdrop-blur-[28px] backdrop-saturate-[110%]"
      style={{ transformOrigin: "top right" }}
    >
      <div className="flex items-center gap-2 pt-2.5 pr-2.5 pl-3">
        <ClaudeTile size={22} />
        <AccountSwitch accounts={accounts} value={account} onChange={onAccountChange} />
        <span className="ml-auto text-2xs text-ink-4">{updated}</span>
        <IconButton aria-label="Refresh" size="sm" onClick={onRefresh} className="size-[26px]">
          <RotateCw width={13} height={13} strokeWidth={2} />
        </IconButton>
      </div>

      <SessionLimit session={session} switchTo={switchTo} onSwitch={onSwitch} />

      <section aria-label="Spend" className="mx-2 border-t border-line pt-3 pb-2">
        <SpendTrend spend={spend} />
        <GlideMenu className="mt-2.5 flex flex-col gap-px">
          {tasks.map((task) => (
            <UsageTaskRow key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </GlideMenu>
      </section>

      <div className="flex h-10 items-center gap-2 border-t border-line bg-inset/35 pr-2 pl-[18px]">
        <span className="text-2xs text-ink-4">{summary}</span>
        <button
          type="button"
          onClick={onDetails}
          className="interactive press ml-auto flex h-[26px] cursor-pointer items-center gap-1.5 rounded-full pr-1.5 pl-2.5 text-xs font-medium text-ink-2 select-none hover:bg-hover hover:text-ink"
        >
          Usage details
          <Kbd>{shortcutLabel("usage")}</Kbd>
        </button>
      </div>
    </div>
  );
}
