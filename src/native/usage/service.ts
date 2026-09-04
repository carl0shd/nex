import * as agentAccountRepo from '@native/db/repositories/agent-account.repo';
import * as projectRepo from '@native/db/repositories/project.repo';
import * as sessionRepo from '@native/db/repositories/session.repo';
import * as terminalRepo from '@native/db/repositories/terminal.repo';
import * as usageRepo from '@native/db/repositories/usage.repo';
import * as workspaceRepo from '@native/db/repositories/workspace.repo';
import type { AgentAccount } from '@native/db/types';
import type { DayRange, ModelBucket } from '@native/db/repositories/usage.repo';
import {
  RateLimitedError,
  UnauthorizedError,
  fetchAccountUsage,
  type AccountUsageResponse
} from '@native/usage/api';
import { resolveKeychainService } from '@native/usage/binding';
import { isExpired, readCredentials } from '@native/usage/credentials';
import { addTokens, costOf, emptyTokens, totalTokens } from '@native/usage/pricing';
import type {
  AccountLimitStatus,
  AccountUsage,
  LimitGauge,
  ModelUsage,
  SessionUsage,
  StatsBucket,
  UsageGranularity,
  UsageStats,
  UsageSummary,
  UsageTotals
} from '@native/usage/types';

const LIMITS_TTL_MS = 5 * 60_000;
const RATE_LIMIT_BACKOFF_MS = 15 * 60_000;
const TREND_DAYS = 14;

const RANGE_DAYS: Record<UsageGranularity, number> = { day: 30, week: 84, month: 365 };

function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Noon anchors the arithmetic so a DST shift never lands on the adjacent day.
function shiftDay(day: string, delta: number): string {
  const [year, month, date] = day.split('-').map(Number);
  return dayKey(new Date(year, month - 1, date + delta, 12));
}

function todayKey(): string {
  return dayKey(new Date());
}

function eachDay(range: DayRange): string[] {
  const days: string[] = [];
  for (let day = range.fromDay; day <= range.toDay; day = shiftDay(day, 1)) days.push(day);
  return days;
}

function emptyTotals(): UsageTotals {
  return { tokens: emptyTokens(), costUsd: 0 };
}

function accumulate(target: UsageTotals, bucket: ModelBucket): void {
  addTokens(target.tokens, bucket.tokens);
  target.costUsd += costOf(bucket.model, bucket.speed, bucket.tokens, bucket.day);
}

function fold(buckets: ModelBucket[]): UsageTotals {
  const totals = emptyTotals();
  for (const bucket of buckets) accumulate(totals, bucket);
  return totals;
}

function bucketStart(day: string, granularity: UsageGranularity): string {
  if (granularity === 'day') return day;
  if (granularity === 'month') return `${day.slice(0, 7)}-01`;

  const [year, month, date] = day.split('-').map(Number);
  const anchor = new Date(year, month - 1, date, 12);
  const mondayOffset = (anchor.getDay() + 6) % 7;
  return shiftDay(day, -mondayOffset);
}

function bucketEnd(startDay: string, granularity: UsageGranularity): string {
  if (granularity === 'day') return startDay;
  if (granularity === 'week') return shiftDay(startDay, 6);

  const [year, month] = startDay.split('-').map(Number);
  return dayKey(new Date(year, month, 0, 12));
}

function rangeFor(granularity: UsageGranularity): DayRange {
  const toDay = todayKey();
  if (granularity === 'month') {
    const [year, month] = toDay.split('-').map(Number);
    return { fromDay: dayKey(new Date(year, month - 12, 1, 12)), toDay };
  }
  return { fromDay: shiftDay(toDay, -(RANGE_DAYS[granularity] - 1)), toDay };
}

function limitLabel(kind: string, scopeLabel: string | null): string {
  if (kind === 'session') return 'Session · 5h';
  if (kind === 'weekly_all') return 'Weekly';
  if (kind === 'weekly_scoped') return scopeLabel ? `Weekly · ${scopeLabel}` : 'Weekly · scoped';
  return scopeLabel ?? kind;
}

interface CachedLimits {
  response: AccountUsageResponse | null;
  status: AccountLimitStatus;
  subscriptionType: string | null;
  fetchedAt: number;
  retryAfter: number;
}

const limitsCache = new Map<string, CachedLimits>();

function failureFor(error: unknown, previous: CachedLimits | undefined): AccountLimitStatus {
  if (error instanceof UnauthorizedError) return 'expired';
  // A throttled endpoint is not an outage: keep showing the last good poll.
  if (error instanceof RateLimitedError) return previous?.response ? previous.status : 'throttled';
  return 'error';
}

async function loadLimits(account: AgentAccount): Promise<CachedLimits> {
  const cached = limitsCache.get(account.id);
  const now = Date.now();
  if (cached && (now - cached.fetchedAt < LIMITS_TTL_MS || now < cached.retryAfter)) return cached;

  const service = await resolveKeychainService(account);
  const credentials = await readCredentials(service, account.configDir);

  let entry: CachedLimits;
  if (!credentials) {
    entry = {
      response: null,
      status: 'unauthenticated',
      subscriptionType: null,
      fetchedAt: now,
      retryAfter: 0
    };
  } else if (isExpired(credentials)) {
    entry = {
      response: null,
      status: 'expired',
      subscriptionType: credentials.subscriptionType,
      fetchedAt: now,
      retryAfter: 0
    };
  } else {
    try {
      entry = {
        response: await fetchAccountUsage(credentials.accessToken),
        status: 'ok',
        subscriptionType: credentials.subscriptionType,
        fetchedAt: now,
        retryAfter: 0
      };
    } catch (error) {
      const backoff =
        error instanceof RateLimitedError
          ? (error.retryAfterMs ?? RATE_LIMIT_BACKOFF_MS)
          : LIMITS_TTL_MS;
      entry = {
        response: cached?.response ?? null,
        status: failureFor(error, cached),
        subscriptionType: credentials.subscriptionType,
        fetchedAt: now,
        retryAfter: now + backoff
      };
    }
  }

  limitsCache.set(account.id, entry);
  return entry;
}

interface SessionContext {
  sessionIdOf: Map<string, string>;
  agentSessionIds: string[];
  describe: (sessionId: string) => Omit<SessionUsage, 'totals'> | null;
}

function sessionContext(): SessionContext {
  const projects = new Map(projectRepo.getAll().map((project) => [project.id, project]));
  const workspaces = new Map(workspaceRepo.getAll().map((workspace) => [workspace.id, workspace]));
  const sessions = new Map(sessionRepo.getAll().map((session) => [session.id, session]));

  const sessionIdOf = new Map<string, string>();
  for (const terminal of terminalRepo.getAll()) {
    if (terminal.agentSessionId) sessionIdOf.set(terminal.agentSessionId, terminal.sessionId);
  }

  return {
    sessionIdOf,
    agentSessionIds: [...sessionIdOf.keys()],
    describe: (sessionId) => {
      const session = sessions.get(sessionId);
      if (!session) return null;
      const project = projects.get(session.projectId);
      const workspace = project ? workspaces.get(project.workspaceId) : undefined;
      return {
        sessionId: session.id,
        name: session.name,
        branch: session.branch,
        projectName: project?.name ?? '',
        workspaceColor: workspace?.color ?? '',
        status: session.status
      };
    }
  };
}

function sessionUsage(
  buckets: usageRepo.AgentSessionBucket[],
  context: SessionContext
): SessionUsage[] {
  const totalsBySession = new Map<string, UsageTotals>();

  for (const bucket of buckets) {
    const sessionId = context.sessionIdOf.get(bucket.agentSessionId);
    if (!sessionId) continue;
    let totals = totalsBySession.get(sessionId);
    if (!totals) {
      totals = emptyTotals();
      totalsBySession.set(sessionId, totals);
    }
    accumulate(totals, bucket);
  }

  const rows: SessionUsage[] = [];
  for (const [sessionId, totals] of totalsBySession) {
    const described = context.describe(sessionId);
    if (described) rows.push({ ...described, totals });
  }

  return rows.sort((a, b) => b.totals.costUsd - a.totals.costUsd);
}

async function accountUsage(today: string): Promise<AccountUsage[]> {
  const accounts = agentAccountRepo.getAll();
  const todayByAccount = new Map<string, UsageTotals>();

  for (const bucket of usageRepo.sumByAccount({ fromDay: today, toDay: today })) {
    if (!bucket.accountId) continue;
    let totals = todayByAccount.get(bucket.accountId);
    if (!totals) {
      totals = emptyTotals();
      todayByAccount.set(bucket.accountId, totals);
    }
    accumulate(totals, bucket);
  }

  return Promise.all(
    accounts.map(async (account) => {
      const { response, status, subscriptionType } = await loadLimits(account);
      const limits: LimitGauge[] = (response?.limits ?? []).map((limit) => ({
        kind: limit.kind,
        label: limitLabel(limit.kind, limit.scopeLabel),
        percent: limit.percent,
        severity: limit.severity,
        resetsAt: limit.resetsAt
      }));

      return {
        accountId: account.id,
        accountName: account.name,
        isDefault: account.isDefault,
        status,
        subscriptionType,
        fiveHourPercent: response?.fiveHourPercent ?? null,
        fiveHourResetsAt: response?.fiveHourResetsAt ?? null,
        sevenDayPercent: response?.sevenDayPercent ?? null,
        sevenDayResetsAt: response?.sevenDayResetsAt ?? null,
        limits,
        todayCostUsd: todayByAccount.get(account.id)?.costUsd ?? 0
      };
    })
  );
}

export async function getUsageSummary(): Promise<UsageSummary> {
  const today = todayKey();
  const context = sessionContext();

  const todayBuckets = usageRepo.sumByDay({ fromDay: today, toDay: today });
  const trendRange: DayRange = { fromDay: shiftDay(today, -(TREND_DAYS - 1)), toDay: today };
  const trendBuckets = usageRepo.sumByDay(trendRange);

  const trendByDay = new Map(eachDay(trendRange).map((day) => [day, emptyTotals()]));
  for (const bucket of trendBuckets) {
    const totals = trendByDay.get(bucket.day);
    if (totals) accumulate(totals, bucket);
  }

  const accounts = await accountUsage(today);
  let worstPercent: number | null = null;
  let worstAccountName: string | null = null;
  for (const account of accounts) {
    const percent = Math.max(account.fiveHourPercent ?? 0, account.sevenDayPercent ?? 0);
    if (account.status !== 'ok') continue;
    if (worstPercent === null || percent > worstPercent) {
      worstPercent = percent;
      worstAccountName = account.accountName;
    }
  }

  return {
    today: {
      total: fold(todayBuckets),
      inNex: fold(todayBuckets.filter((bucket) => bucket.inNex)),
      outsideNex: fold(todayBuckets.filter((bucket) => !bucket.inNex))
    },
    trend: [...trendByDay].map(([day, totals]) => ({
      day,
      costUsd: totals.costUsd,
      tokens: totalTokens(totals.tokens)
    })),
    sessions: sessionUsage(usageRepo.sumForAgentSessions(context.agentSessionIds), context).filter(
      (session) => session.status !== 'done'
    ),
    accounts,
    worstPercent,
    worstAccountName,
    updatedAt: new Date().toISOString()
  };
}

function statsBuckets(
  buckets: usageRepo.DayBucket[],
  range: DayRange,
  granularity: UsageGranularity
): StatsBucket[] {
  const byStart = new Map<string, StatsBucket>();

  for (const day of eachDay(range)) {
    const startDay = bucketStart(day, granularity);
    if (byStart.has(startDay)) continue;
    byStart.set(startDay, {
      startDay,
      endDay: bucketEnd(startDay, granularity),
      costUsd: 0,
      inNexCostUsd: 0,
      tokens: 0
    });
  }

  for (const bucket of buckets) {
    const entry = byStart.get(bucketStart(bucket.day, granularity));
    if (!entry) continue;
    const cost = costOf(bucket.model, bucket.speed, bucket.tokens, bucket.day);
    entry.costUsd += cost;
    entry.tokens += totalTokens(bucket.tokens);
    if (bucket.inNex) entry.inNexCostUsd += cost;
  }

  return [...byStart.values()].sort((a, b) => a.startDay.localeCompare(b.startDay));
}

function modelUsage(buckets: usageRepo.DayBucket[]): ModelUsage[] {
  const byModel = new Map<string, ModelUsage>();

  for (const bucket of buckets) {
    let entry = byModel.get(bucket.model);
    if (!entry) {
      entry = { model: bucket.model, costUsd: 0, tokens: 0 };
      byModel.set(bucket.model, entry);
    }
    entry.costUsd += costOf(bucket.model, bucket.speed, bucket.tokens, bucket.day);
    entry.tokens += totalTokens(bucket.tokens);
  }

  return [...byModel.values()].sort((a, b) => b.costUsd - a.costUsd);
}

export function getUsageStats(granularity: UsageGranularity): UsageStats {
  const range = rangeFor(granularity);
  const dayBuckets = usageRepo.sumByDay(range);
  const context = sessionContext();

  const accountNames = new Map(
    agentAccountRepo.getAll().map((account) => [account.id, account.name])
  );
  const byAccount = new Map<
    string,
    { accountId: string | null; accountName: string; costUsd: number; tokens: number }
  >();

  for (const bucket of usageRepo.sumByAccount(range)) {
    const key = bucket.accountId ?? '';
    let entry = byAccount.get(key);
    if (!entry) {
      entry = {
        accountId: bucket.accountId,
        accountName: bucket.accountId
          ? (accountNames.get(bucket.accountId) ?? 'Unknown')
          : 'Unlinked',
        costUsd: 0,
        tokens: 0
      };
      byAccount.set(key, entry);
    }
    entry.costUsd += costOf(bucket.model, bucket.speed, bucket.tokens, bucket.day);
    entry.tokens += totalTokens(bucket.tokens);
  }

  const total = fold(dayBuckets);

  return {
    granularity,
    buckets: statsBuckets(dayBuckets, range, granularity),
    byModel: modelUsage(dayBuckets),
    byAccount: [...byAccount.values()].sort((a, b) => b.costUsd - a.costUsd),
    sessions: sessionUsage(usageRepo.sumByAgentSession(range), context),
    total,
    inNexCostUsd: fold(dayBuckets.filter((bucket) => bucket.inNex)).costUsd,
    rangeStartDay: range.fromDay,
    rangeEndDay: range.toDay,
    historyStartDay: usageRepo.firstEventDay()
  };
}

// A manual refresh re-reads transcripts freely, but must not stampede an
// endpoint that already told us to back off.
export function invalidateLimitsCache(): void {
  const now = Date.now();
  for (const [accountId, entry] of limitsCache) {
    if (now < entry.retryAfter) continue;
    limitsCache.delete(accountId);
  }
}
