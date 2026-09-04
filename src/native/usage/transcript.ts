import { closeSync, openSync, readdirSync, readSync, statSync } from 'fs';
import { join } from 'path';
import { StringDecoder } from 'string_decoder';
import { emptyTokens, type ModelSpeed, type TokenCounts } from '@native/usage/pricing';

export interface UsageRecord {
  key: string;
  agentSessionId: string;
  cwd: string;
  model: string;
  speed: ModelSpeed;
  timestamp: string;
  tokens: TokenCounts;
}

export interface TranscriptScan {
  records: UsageRecord[];
  offset: number;
  size: number;
}

const CHUNK_BYTES = 1 << 20;

// Claude Code stamps locally generated assistant turns (API error placeholders
// and the like) with this in place of a model; they are never billed.
const SYNTHETIC_MODEL = '<synthetic>';

interface RawUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_creation?: {
    ephemeral_5m_input_tokens?: number;
    ephemeral_1h_input_tokens?: number;
  };
  server_tool_use?: { web_search_requests?: number };
  speed?: string;
}

interface RawLine {
  type?: string;
  timestamp?: string;
  sessionId?: string;
  cwd?: string;
  requestId?: string;
  message?: { id?: string; model?: string; usage?: RawUsage };
}

export function listTranscriptFiles(configDir: string): string[] {
  const root = join(configDir, 'projects');
  const files: string[] = [];

  let projectDirs: string[];
  try {
    projectDirs = readdirSync(root);
  } catch {
    return files;
  }

  for (const dir of projectDirs) {
    let entries: string[];
    try {
      entries = readdirSync(join(root, dir));
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.endsWith('.jsonl')) files.push(join(root, dir, entry));
    }
  }

  return files;
}

function tokensFrom(usage: RawUsage): TokenCounts {
  const tokens = emptyTokens();
  tokens.input = usage.input_tokens ?? 0;
  tokens.output = usage.output_tokens ?? 0;
  tokens.cacheRead = usage.cache_read_input_tokens ?? 0;
  tokens.cacheWrite5m = usage.cache_creation?.ephemeral_5m_input_tokens ?? 0;
  tokens.cacheWrite1h = usage.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  tokens.webSearches = usage.server_tool_use?.web_search_requests ?? 0;

  // Transcripts written before the per-TTL split only carry the flat total.
  if (!tokens.cacheWrite5m && !tokens.cacheWrite1h) {
    tokens.cacheWrite5m = usage.cache_creation_input_tokens ?? 0;
  }

  return tokens;
}

function recordFrom(line: string): UsageRecord | null {
  let parsed: RawLine;
  try {
    parsed = JSON.parse(line) as RawLine;
  } catch {
    return null;
  }

  if (parsed.type !== 'assistant') return null;

  const usage = parsed.message?.usage;
  const model = parsed.message?.model;
  if (!usage || !model || model === SYNTHETIC_MODEL) return null;

  const messageId = parsed.message?.id ?? '';
  const requestId = parsed.requestId ?? '';
  if (!messageId && !requestId) return null;

  return {
    key: `${messageId}:${requestId}`,
    agentSessionId: parsed.sessionId ?? '',
    cwd: parsed.cwd ?? '',
    model,
    speed: usage.speed === 'fast' ? 'fast' : 'standard',
    timestamp: parsed.timestamp ?? '',
    tokens: tokensFrom(usage)
  };
}

// Transcripts are append-only, so a scan resumes at the byte offset the previous
// one stopped at and only whole lines are ever committed.
export function scanTranscript(filePath: string, fromOffset: number): TranscriptScan {
  let size: number;
  try {
    size = statSync(filePath).size;
  } catch {
    return { records: [], offset: fromOffset, size: fromOffset };
  }

  const start = size < fromOffset ? 0 : fromOffset;
  if (size === start) return { records: [], offset: start, size };

  const records: UsageRecord[] = [];
  const decoder = new StringDecoder('utf8');
  const buffer = Buffer.allocUnsafe(CHUNK_BYTES);
  let readAt = start;
  let committed = start;
  let carry = '';
  let fd: number;

  try {
    fd = openSync(filePath, 'r');
  } catch {
    return { records: [], offset: start, size: start };
  }

  try {
    while (readAt < size) {
      const bytes = readSync(fd, buffer, 0, Math.min(CHUNK_BYTES, size - readAt), readAt);
      if (bytes <= 0) break;
      readAt += bytes;

      const parts = (carry + decoder.write(buffer.subarray(0, bytes))).split('\n');
      carry = parts.pop() ?? '';

      for (const part of parts) {
        committed += Buffer.byteLength(part) + 1;
        if (!part) continue;
        const record = recordFrom(part);
        if (record) records.push(record);
      }
    }
  } finally {
    closeSync(fd);
  }

  return { records, offset: committed, size };
}
