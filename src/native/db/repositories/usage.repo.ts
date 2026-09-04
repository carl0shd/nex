import { getDb } from '@native/db/database';
import type { ModelSpeed, TokenCounts } from '@native/usage/pricing';
import type { UsageRecord } from '@native/usage/transcript';

export interface DayRange {
  fromDay: string;
  toDay: string;
}

// Every bucket carries its local day so pricing that changes over time can be
// applied to the right rows instead of to one blended total.
export interface ModelBucket {
  day: string;
  model: string;
  speed: ModelSpeed;
  tokens: TokenCounts;
}

export interface DayBucket extends ModelBucket {
  inNex: boolean;
}

export interface AgentSessionBucket extends ModelBucket {
  agentSessionId: string;
}

export interface AccountBucket extends ModelBucket {
  accountId: string | null;
}

export interface ScanState {
  filePath: string;
  size: number;
  byteOffset: number;
}

interface BucketRow {
  model: string;
  speed: string;
  input_tokens: number;
  output_tokens: number;
  cache_write_5m: number;
  cache_write_1h: number;
  cache_read: number;
  web_searches: number;
}

const TOKEN_SUMS = `
  SUM(input_tokens) AS input_tokens,
  SUM(output_tokens) AS output_tokens,
  SUM(cache_write_5m) AS cache_write_5m,
  SUM(cache_write_1h) AS cache_write_1h,
  SUM(cache_read) AS cache_read,
  SUM(web_searches) AS web_searches`;

const LOCAL_DAY = `date(ts, 'localtime')`;

const IN_NEX = `EXISTS (SELECT 1 FROM terminals t WHERE t.agent_session_id = u.agent_session_id)`;

function toTokens(row: BucketRow): TokenCounts {
  return {
    input: row.input_tokens,
    output: row.output_tokens,
    cacheWrite5m: row.cache_write_5m,
    cacheWrite1h: row.cache_write_1h,
    cacheRead: row.cache_read,
    webSearches: row.web_searches
  };
}

function toBucket(row: BucketRow & { day: string }): ModelBucket {
  return {
    day: row.day,
    model: row.model,
    speed: row.speed === 'fast' ? 'fast' : 'standard',
    tokens: toTokens(row)
  };
}

export function insertMany(records: UsageRecord[], accountId: string | null): number {
  if (records.length === 0) return 0;

  const db = getDb();
  const statement = db.prepare(
    `INSERT OR IGNORE INTO usage_events
       (key, account_id, agent_session_id, cwd, model, speed, ts,
        input_tokens, output_tokens, cache_write_5m, cache_write_1h, cache_read, web_searches)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let inserted = 0;
  const run = db.transaction((rows: UsageRecord[]) => {
    for (const row of rows) {
      const result = statement.run(
        row.key,
        accountId,
        row.agentSessionId,
        row.cwd,
        row.model,
        row.speed,
        row.timestamp,
        row.tokens.input,
        row.tokens.output,
        row.tokens.cacheWrite5m,
        row.tokens.cacheWrite1h,
        row.tokens.cacheRead,
        row.tokens.webSearches
      );
      inserted += result.changes;
    }
  });

  run(records);
  return inserted;
}

export function getScanState(filePath: string): ScanState | null {
  const row = getDb()
    .prepare('SELECT file_path, size, byte_offset FROM usage_scan WHERE file_path = ?')
    .get(filePath) as { file_path: string; size: number; byte_offset: number } | undefined;
  return row ? { filePath: row.file_path, size: row.size, byteOffset: row.byte_offset } : null;
}

export function setScanState(
  filePath: string,
  accountId: string | null,
  size: number,
  byteOffset: number
): void {
  getDb()
    .prepare(
      `INSERT INTO usage_scan (file_path, account_id, size, byte_offset, scanned_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(file_path) DO UPDATE SET
         account_id = excluded.account_id,
         size = excluded.size,
         byte_offset = excluded.byte_offset,
         scanned_at = excluded.scanned_at`
    )
    .run(filePath, accountId, size, byteOffset);
}

export function pruneScanState(existingPaths: string[]): void {
  const db = getDb();
  if (existingPaths.length === 0) {
    db.prepare('DELETE FROM usage_scan').run();
    return;
  }
  const placeholders = existingPaths.map(() => '?').join(',');
  db.prepare(`DELETE FROM usage_scan WHERE file_path NOT IN (${placeholders})`).run(
    ...existingPaths
  );
}

export function sumByDay(range: DayRange, accountId?: string): DayBucket[] {
  const filter = accountId ? 'AND u.account_id = ?' : '';
  const params: unknown[] = [range.fromDay, range.toDay];
  if (accountId) params.push(accountId);

  const rows = getDb()
    .prepare(
      `SELECT ${LOCAL_DAY} AS day, ${IN_NEX} AS in_nex, model, speed, ${TOKEN_SUMS}
       FROM usage_events u
       WHERE ${LOCAL_DAY} BETWEEN ? AND ? ${filter}
       GROUP BY day, in_nex, model, speed
       ORDER BY day`
    )
    .all(...params) as (BucketRow & { day: string; in_nex: number })[];

  return rows.map((row) => ({ ...toBucket(row), inNex: row.in_nex === 1 }));
}

export function sumByAgentSession(range: DayRange): AgentSessionBucket[] {
  const rows = getDb()
    .prepare(
      `SELECT ${LOCAL_DAY} AS day, agent_session_id, model, speed, ${TOKEN_SUMS}
       FROM usage_events u
       WHERE ${LOCAL_DAY} BETWEEN ? AND ? AND agent_session_id <> ''
       GROUP BY day, agent_session_id, model, speed`
    )
    .all(range.fromDay, range.toDay) as (BucketRow & { day: string; agent_session_id: string })[];

  return rows.map((row) => ({ ...toBucket(row), agentSessionId: row.agent_session_id }));
}

export function sumForAgentSessions(agentSessionIds: string[]): AgentSessionBucket[] {
  if (agentSessionIds.length === 0) return [];
  const placeholders = agentSessionIds.map(() => '?').join(',');

  const rows = getDb()
    .prepare(
      `SELECT ${LOCAL_DAY} AS day, agent_session_id, model, speed, ${TOKEN_SUMS}
       FROM usage_events u
       WHERE agent_session_id IN (${placeholders})
       GROUP BY day, agent_session_id, model, speed`
    )
    .all(...agentSessionIds) as (BucketRow & { day: string; agent_session_id: string })[];

  return rows.map((row) => ({ ...toBucket(row), agentSessionId: row.agent_session_id }));
}

export function sumByAccount(range: DayRange): AccountBucket[] {
  const rows = getDb()
    .prepare(
      `SELECT ${LOCAL_DAY} AS day, account_id, model, speed, ${TOKEN_SUMS}
       FROM usage_events u
       WHERE ${LOCAL_DAY} BETWEEN ? AND ?
       GROUP BY day, account_id, model, speed`
    )
    .all(range.fromDay, range.toDay) as (BucketRow & { day: string; account_id: string | null })[];

  return rows.map((row) => ({ ...toBucket(row), accountId: row.account_id }));
}

export function firstEventDay(): string | null {
  const row = getDb().prepare(`SELECT MIN(${LOCAL_DAY}) AS day FROM usage_events`).get() as
    { day: string | null } | undefined;
  return row?.day ?? null;
}
