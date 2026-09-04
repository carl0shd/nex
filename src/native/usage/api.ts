const BASE_URL = 'https://api.anthropic.com';
const OAUTH_BETA = 'oauth-2025-04-20';
const TIMEOUT_MS = 10_000;

export interface LimitWindow {
  kind: string;
  group: string;
  percent: number;
  severity: string;
  resetsAt: string | null;
  scopeLabel: string | null;
  isActive: boolean;
}

export interface AccountUsageResponse {
  fiveHourPercent: number | null;
  fiveHourResetsAt: string | null;
  sevenDayPercent: number | null;
  sevenDayResetsAt: string | null;
  limits: LimitWindow[];
  extraUsageEnabled: boolean;
  extraUsagePercent: number | null;
}

export interface AccountProfile {
  email: string;
  accountUuid: string;
  organizationName: string | null;
  rateLimitTier: string | null;
}

interface RawWindow {
  utilization?: number | null;
  resets_at?: string | null;
}

interface RawLimit {
  kind?: string;
  group?: string;
  percent?: number;
  severity?: string;
  resets_at?: string | null;
  is_active?: boolean;
  scope?: { model?: { display_name?: string | null } | null; surface?: string | null } | null;
}

interface RawUsageBody {
  five_hour?: RawWindow | null;
  seven_day?: RawWindow | null;
  limits?: RawLimit[] | null;
  extra_usage?: { is_enabled?: boolean; utilization?: number | null } | null;
}

interface RawProfileBody {
  account?: { email?: string; uuid?: string } | null;
  organization?: { name?: string | null; rate_limit_tier?: string | null } | null;
}

export class UnauthorizedError extends Error {}

export class RateLimitedError extends Error {
  constructor(readonly retryAfterMs: number | null) {
    super('rate limited');
  }
}

function retryAfterOf(response: Response): number | null {
  const header = response.headers.get('retry-after');
  if (!header) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : null;
}

async function get<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'anthropic-beta': OAUTH_BETA
    },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });

  if (response.status === 401 || response.status === 403) {
    throw new UnauthorizedError(`${path} returned ${response.status}`);
  }
  if (response.status === 429) {
    throw new RateLimitedError(retryAfterOf(response));
  }
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return (await response.json()) as T;
}

function scopeLabelOf(limit: RawLimit): string | null {
  const model = limit.scope?.model?.display_name;
  if (model) return model;
  return limit.scope?.surface ?? null;
}

export async function fetchAccountUsage(accessToken: string): Promise<AccountUsageResponse> {
  const body = await get<RawUsageBody>('/api/oauth/usage', accessToken);

  return {
    fiveHourPercent: body.five_hour?.utilization ?? null,
    fiveHourResetsAt: body.five_hour?.resets_at ?? null,
    sevenDayPercent: body.seven_day?.utilization ?? null,
    sevenDayResetsAt: body.seven_day?.resets_at ?? null,
    limits: (body.limits ?? []).map((limit) => ({
      kind: limit.kind ?? 'unknown',
      group: limit.group ?? 'unknown',
      percent: limit.percent ?? 0,
      severity: limit.severity ?? 'normal',
      resetsAt: limit.resets_at ?? null,
      scopeLabel: scopeLabelOf(limit),
      isActive: limit.is_active === true
    })),
    extraUsageEnabled: body.extra_usage?.is_enabled === true,
    extraUsagePercent: body.extra_usage?.utilization ?? null
  };
}

export async function fetchAccountProfile(accessToken: string): Promise<AccountProfile | null> {
  const body = await get<RawProfileBody>('/api/oauth/profile', accessToken);
  const email = body.account?.email;
  if (!email) return null;

  return {
    email,
    accountUuid: body.account?.uuid ?? '',
    organizationName: body.organization?.name ?? null,
    rateLimitTier: body.organization?.rate_limit_tier ?? null
  };
}
