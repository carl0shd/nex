import { useEffect } from "react";
import type { UsageSummary } from "@native/usage/types";
import { limitWarning } from "@/lib/limit-warning";
import { notify } from "@/lib/notify";
import { parseSpendAlert } from "@/lib/preferences";
import { activeLimit, formatUsd } from "@/lib/usage";
import { usePreferencesStore } from "@/stores/preferences.store";

const URGENT = 95;
const warned = new Set<string>();

export function useLimitWarnings(summary: UsageSummary | null, onSwitched: () => void) {
  const enabled = usePreferencesStore((s) => s.prefs.notifyUsage);
  const warnAt = Number(usePreferencesStore((s) => s.prefs.warnAt));
  const dailyAlert = parseSpendAlert(usePreferencesStore((s) => s.prefs.dailyAlert));
  useEffect(() => {
    if (!summary || !enabled) return;
    const now = new Date();
    const spent = summary.today.total.costUsd;
    const today = summary.trend.at(-1)?.day ?? now.toDateString();
    if (dailyAlert !== null && spent >= dailyAlert && !warned.has(`spend:${today}`)) {
      warned.add(`spend:${today}`);
      notify({
        tone: "orange",
        status: "Usage",
        title: `You spent ${formatUsd(spent)} today`,
        body: `That is over your daily alert of ${formatUsd(dailyAlert)}.`,
        actions: [{ label: "Dismiss", kind: "ghost" }],
      });
    }
    const thresholds = [warnAt, Math.max(warnAt, URGENT)];
    const usable = summary.accounts.filter((account) => account.status === "ok");
    for (const account of usable) {
      const warning = limitWarning(account, now, thresholds);
      if (!warning || warned.has(warning.key)) continue;
      warned.add(warning.key);
      const alternative = account.isDefault
        ? usable
            .filter((other) => other.accountId !== account.accountId)
            .map((other) => ({ other, percent: activeLimit(other).percent ?? 0 }))
            .filter(({ percent }) => percent < warnAt)
            .toSorted((a, b) => a.percent - b.percent)[0]?.other
        : undefined;
      notify(
        {
          tone: warning.threshold >= URGENT ? "red" : "orange",
          status: "Usage",
          meta: usable.length > 1 ? account.accountName : undefined,
          title: warning.title,
          body: warning.body,
          actions: [
            ...(alternative
              ? [
                  {
                    label: `Use ${alternative.accountName} for new tasks`,
                    kind: "neutral" as const,
                    onClick: () =>
                      void window.api
                        .updateAgentAccount(alternative.accountId, { isDefault: true })
                        .then(onSwitched),
                  },
                ]
              : []),
            { label: "Dismiss", kind: "ghost" },
          ],
        },
        { id: `limit:${account.accountId}` },
      );
    }
  }, [summary, onSwitched, enabled, warnAt, dailyAlert]);
}
