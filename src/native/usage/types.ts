import type { TokenCounts } from '@native/usage/pricing';
import type { SessionStatus } from '@native/db/types';

export type UsageGranularity = 'day' | 'week' | 'month';

export type AccountLimitStatus = 'ok' | 'unauthenticated' | 'expired' | 'throttled' | 'error';

export interface UsageTotals {
  tokens: TokenCounts;
  costUsd: number;
}

export interface DayTotal {
  day: string;
  costUsd: number;
  tokens: number;
}

export interface SessionUsage {
  sessionId: string;
  name: string;
  branch: string;
  projectName: string;
  workspaceColor: string;
  status: SessionStatus;
  totals: UsageTotals;
}

export interface LimitGauge {
  kind: string;
  label: string;
  percent: number;
  severity: string;
  resetsAt: string | null;
}

export interface AccountUsage {
  accountId: string;
  accountName: string;
  isDefault: boolean;
  status: AccountLimitStatus;
  subscriptionType: string | null;
  fiveHourPercent: number | null;
  fiveHourResetsAt: string | null;
  sevenDayPercent: number | null;
  sevenDayResetsAt: string | null;
  limits: LimitGauge[];
  todayCostUsd: number;
}

export interface UsageSummary {
  today: {
    total: UsageTotals;
    inNex: UsageTotals;
    outsideNex: UsageTotals;
  };
  trend: DayTotal[];
  sessions: SessionUsage[];
  accounts: AccountUsage[];
  worstPercent: number | null;
  worstAccountName: string | null;
  updatedAt: string;
}

export interface StatsBucket {
  startDay: string;
  endDay: string;
  costUsd: number;
  inNexCostUsd: number;
  tokens: number;
}

export interface ModelUsage {
  model: string;
  costUsd: number;
  tokens: number;
}

export interface UsageStats {
  granularity: UsageGranularity;
  buckets: StatsBucket[];
  byModel: ModelUsage[];
  byAccount: { accountId: string | null; accountName: string; costUsd: number; tokens: number }[];
  sessions: SessionUsage[];
  total: UsageTotals;
  inNexCostUsd: number;
  rangeStartDay: string;
  rangeEndDay: string;
  historyStartDay: string | null;
}
