import type { AccountLimitStatus } from "@native/usage/types";
import { accountLabel } from "@/lib/accounts";
import { useEffect, useState } from "react";
import type { AgentAccount } from "@native/db/types";
import type { UsageSummary } from "@native/usage/types";
import type { UsageAccount } from "@/components/usage/account-switch";
import { UsagePanel, type UsageTask, type UsageTaskStatus } from "@/components/usage/usage-panel";
import {
  comparedToAverage,
  dayLabel,
  formatTokens,
  formatUsd,
  activeLimit,
  sessionForecast,
  updatedLabel,
  usageTone,
} from "@/lib/usage";
import { useWorkspaceStore } from "@/stores/workspace.store";

const TASKS_SHOWN = 5;
const CLOCK_MS = 30_000;

const STATUS_PROBLEM: Record<
  Exclude<AccountLimitStatus, "ok">,
  { title: string; detail: string }
> = {
  expired: {
    title: "Sign-in expired",
    detail: "It renews the next time a task uses this account",
  },
  unauthenticated: {
    title: "Not signed in",
    detail: "Sign in to this account to see its limits",
  },
  throttled: {
    title: "Usage is busy",
    detail: "Claude asked us to wait a moment before checking again",
  },
  error: {
    title: "Couldn't load usage",
    detail: "We'll try again on the next refresh",
  },
};

export function AppUsagePanel({
  summary,
  onRefresh,
  onChanged,
}: {
  summary: UsageSummary;
  onRefresh: () => void;
  onChanged: () => void;
}) {
  const terminals = useWorkspaceStore((s) => s.terminals);
  const openTask = useWorkspaceStore((s) => s.openTask);
  const [saved, setSaved] = useState<AgentAccount[]>([]);
  const fallback = summary.accounts.find((account) => account.isDefault) ?? summary.accounts[0];
  const [selected, setSelected] = useState(fallback?.accountId ?? "");

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    void window.api.getAgentAccounts().then(setSaved);
  }, [summary.accounts.length]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_MS);
    return () => clearInterval(timer);
  }, []);

  const current =
    summary.accounts.find((account) => account.accountId === selected) ?? fallback ?? null;
  const accounts: UsageAccount[] = summary.accounts.map((account) => {
    const own = saved.find((item) => item.id === account.accountId);
    return {
      id: account.accountId,
      name: own ? accountLabel(own) : account.accountName,
      color: own?.color ?? "var(--accent)",
    };
  });
  const limit = current ? activeLimit(current) : null;
  const forecast = sessionForecast(
    limit?.percent ?? null,
    limit?.resetsAt ?? null,
    now,
    limit?.window,
  );
  const problem = current && current.status !== "ok" ? STATUS_PROBLEM[current.status] : null;
  const session = problem
    ? { ...forecast, unavailable: problem.title, forecast: problem.detail }
    : forecast;
  const alternative = summary.accounts
    .filter((account) => account.accountId !== current?.accountId && account.status === "ok")
    .toSorted((a, b) => (a.fiveHourPercent ?? 0) - (b.fiveHourPercent ?? 0))[0];
  const alternativeName = accounts.find((item) => item.id === alternative?.accountId)?.name;

  const statusOf = (sessionId: string): UsageTaskStatus => {
    const agent = terminals.find(
      (terminal) => terminal.sessionId === sessionId && terminal.type === "agent",
    );
    return agent?.status ?? "idle";
  };
  const spend = current?.spend ?? { today: summary.today, trend: summary.trend };
  const accountSessions = summary.sessions.filter(
    (task) => !current || (task.accountId ?? fallback?.accountId) === current.accountId,
  );
  const tasks: UsageTask[] = accountSessions
    .toSorted((a, b) => b.totals.costUsd - a.totals.costUsd)
    .slice(0, TASKS_SHOWN)
    .map((task) => ({
      id: task.sessionId,
      title: task.name,
      project: task.projectName,
      status: statusOf(task.sessionId),
      cost: formatUsd(task.totals.costUsd),
    }));
  const lastDays = spend.trend.map((day) => day.costUsd);
  const tokensToday = spend.trend.at(-1)?.tokens ?? 0;

  return (
    <UsagePanel
      accounts={accounts}
      account={current?.accountId ?? ""}
      onAccountChange={setSelected}
      updated={updatedLabel(new Date(summary.updatedAt), now)}
      onRefresh={onRefresh}
      session={session}
      switchTo={usageTone(session.percent) === "red" ? alternativeName : undefined}
      onSwitch={() => {
        if (!alternative) return;
        void window.api
          .updateAgentAccount(alternative.accountId, { isDefault: true })
          .then(onChanged);
      }}
      spend={{
        today: formatUsd(spend.today.total.costUsd),
        inNex: formatUsd(spend.today.inNex.costUsd),
        outside: formatUsd(spend.today.outsideNex.costUsd),
        comparedToAverage: comparedToAverage(lastDays),
        lastDays,
        days: spend.trend.map((day) => ({
          label: dayLabel(day.day, spend.trend.at(-1)?.day ?? day.day),
          costUsd: day.costUsd,
          tokens: day.tokens,
        })),
      }}
      tasks={tasks}
      onOpenTask={openTask}
      summary={`${accountSessions.length} ${accountSessions.length === 1 ? "task" : "tasks"} · ${formatTokens(tokensToday)} tokens today`}
    />
  );
}
