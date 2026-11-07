import { useEffect, useState } from "react";
import { accountLabel } from "@/lib/accounts";
import { activeLimit } from "@/lib/usage";

const ROOM_BELOW_PERCENT = 90;

export interface AlternativeAccount {
  id: string;
  label: string;
}

export function useAlternativeAccount(
  currentId: string | null,
  enabled: boolean,
): AlternativeAccount | null {
  const [alternative, setAlternative] = useState<AlternativeAccount | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void Promise.all([window.api.getAgentAccounts(), window.api.usage.getSummary()])
      .then(([accounts, summary]) => {
        const current = accounts.find((account) => account.id === currentId);
        const best = summary.accounts
          .filter((usage) => usage.status === "ok" && usage.accountId !== currentId)
          .map((usage) => ({ usage, percent: activeLimit(usage).percent ?? 0 }))
          .filter(({ percent }) => percent < ROOM_BELOW_PERCENT)
          .toSorted((a, b) => a.percent - b.percent)
          .map(({ usage }) => accounts.find((account) => account.id === usage.accountId))
          .find((account) => account && (!current || account.agentId === current.agentId));
        if (!cancelled) setAlternative(best ? { id: best.id, label: accountLabel(best) } : null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentId, enabled]);
  return enabled ? alternative : null;
}
