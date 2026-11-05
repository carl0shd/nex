export type LiveBlock =
  | { kind: "text"; index: number; text: string }
  | { kind: "thinking"; index: number }
  | { kind: "tool"; index: number; name: string; json: string };

export interface TurnTokens {
  finished: number;
  message: number | null;
  thinking: number;
  streamedChars: number;
  peak: number;
}

export interface ApiRetry {
  attempt: number;
  maxRetries: number;
  retryAt: number;
  error: string;
}

export interface AgentExit {
  code: number | null;
  log: string;
  at: number;
  missingWorktree?: boolean;
}

export interface SubagentStep {
  id: string;
  name: string;
  input: Record<string, unknown>;
  done: boolean;
}

export interface LiveState {
  entries: Record<string, unknown>[];
  blocks: LiveBlock[];
  tokens: TurnTokens;
  retry: ApiRetry | null;
  exit: AgentExit | null;
  subagents: Record<string, SubagentStep[]>;
  contextWindow?: number;
  permissionMode?: string;
  compacting?: boolean;
}

const NO_TOKENS: TurnTokens = {
  finished: 0,
  message: null,
  thinking: 0,
  streamedChars: 0,
  peak: 0,
};
const CHARS_PER_TOKEN = 4;
const LARGE_CONTEXT_WINDOW = 1_000_000;
const KEPT_ENTRIES = 400;

export const EMPTY_LIVE: LiveState = {
  entries: [],
  blocks: [],
  tokens: NO_TOKENS,
  retry: null,
  exit: null,
  subagents: {},
};

function messageTokens(tokens: TurnTokens): number {
  return tokens.message ?? tokens.thinking + Math.ceil(tokens.streamedChars / CHARS_PER_TOKEN);
}

export function turnTokens(state: LiveState): number {
  return Math.max(state.tokens.peak, state.tokens.finished + messageTokens(state.tokens));
}

function withPeak(tokens: TurnTokens): TurnTokens {
  const total = tokens.finished + messageTokens(tokens);
  return total > tokens.peak ? { ...tokens, peak: total } : tokens;
}

function countTokens(tokens: TurnTokens, event: StreamEvent): TurnTokens {
  switch (event.type) {
    case "message_start":
      return { ...tokens, message: null, thinking: 0, streamedChars: 0 };
    case "content_block_delta": {
      const added = (event.delta?.text ?? event.delta?.partial_json ?? event.delta?.thinking ?? "")
        .length;
      return added ? { ...tokens, streamedChars: tokens.streamedChars + added } : tokens;
    }
    case "message_delta":
      return { ...tokens, message: event.usage?.output_tokens ?? tokens.message };
    case "message_stop":
      return { ...NO_TOKENS, finished: tokens.finished + messageTokens(tokens), peak: tokens.peak };
    default:
      return tokens;
  }
}

const LIVE_KIND: Record<string, LiveBlock["kind"]> = {
  text: "text",
  thinking: "thinking",
  redacted_thinking: "thinking",
  tool_use: "tool",
};

interface StreamEvent {
  type?: string;
  usage?: { output_tokens?: number };
  index?: number;
  content_block?: { type?: string; name?: string };
  delta?: { type?: string; text?: string; partial_json?: string; thinking?: string };
}

function normalize(message: Record<string, unknown>): Record<string, unknown> {
  if (!("tool_use_result" in message)) return message;
  const { tool_use_result: toolUseResult, ...rest } = message;
  return { ...rest, toolUseResult };
}

function applyStream(blocks: LiveBlock[], event: StreamEvent): LiveBlock[] {
  const index = event.index ?? 0;
  switch (event.type) {
    case "message_start":
    case "message_stop":
      return [];
    case "content_block_start": {
      const type = event.content_block?.type;
      const block: LiveBlock | null =
        type === "text"
          ? { kind: "text", index, text: "" }
          : type === "thinking" || type === "redacted_thinking"
            ? { kind: "thinking", index }
            : type === "tool_use"
              ? { kind: "tool", index, name: event.content_block?.name ?? "", json: "" }
              : null;
      return block ? [...blocks.filter((item) => item.index !== index), block] : blocks;
    }
    case "content_block_delta":
      return blocks.map((block) => {
        if (block.index !== index) return block;
        if (block.kind === "text" && event.delta?.type === "text_delta") {
          return { ...block, text: block.text + (event.delta.text ?? "") };
        }
        if (block.kind === "tool" && event.delta?.type === "input_json_delta") {
          return { ...block, json: block.json + (event.delta.partial_json ?? "") };
        }
        return block;
      });
    case "content_block_stop":
      return blocks.filter((block) => block.index !== index);
    default:
      return blocks;
  }
}

interface RawContent {
  type?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
}

function applySubagent(state: LiveState, event: Record<string, unknown>): LiveState {
  const parent = String(event.parent_tool_use_id);
  const content = (event.message as { content?: RawContent[] } | undefined)?.content;
  if (!Array.isArray(content)) return state;
  let steps = state.subagents[parent] ?? [];
  if (event.type === "assistant") {
    const started = content
      .filter((block) => block.type === "tool_use" && block.id)
      .map((block) => ({
        id: String(block.id),
        name: String(block.name ?? ""),
        input: block.input ?? {},
        done: false,
      }));
    if (started.length === 0) return state;
    steps = [...steps, ...started];
  } else if (event.type === "user") {
    const finished = new Set(
      content.filter((block) => block.type === "tool_result").map((block) => block.tool_use_id),
    );
    if (finished.size === 0) return state;
    steps = steps.map((step) => (finished.has(step.id) ? { ...step, done: true } : step));
  } else return state;
  return { ...state, subagents: { ...state.subagents, [parent]: steps } };
}

function apiRetry(event: Record<string, unknown>): ApiRetry {
  return {
    attempt: Number(event.attempt ?? 1),
    maxRetries: Number(event.max_retries ?? 0),
    retryAt: Date.now() + Number(event.retry_delay_ms ?? 0),
    error: String(event.error ?? "API error"),
  };
}

export function applyLiveEvent(state: LiveState, event: Record<string, unknown>): LiveState {
  if (event.parent_tool_use_id) return applySubagent(state, event);
  if (event.type === "nex_exit") {
    return {
      ...state,
      blocks: [],
      retry: null,
      exit: {
        code: (event.code as number | null) ?? null,
        log: String(event.log ?? ""),
        at: Date.now(),
        missingWorktree: event.reason === "missing-worktree",
      },
    };
  }
  if (
    event.type === "system" &&
    typeof event.permissionMode === "string" &&
    event.permissionMode !== state.permissionMode
  ) {
    return applyLiveEvent(
      { ...state, permissionMode: event.permissionMode },
      { ...event, permissionMode: undefined },
    );
  }
  if (event.type === "system" && event.subtype === "status" && "status" in event) {
    const compacting = event.status === "compacting";
    if (compacting !== Boolean(state.compacting)) return { ...state, compacting };
  }
  if (event.type === "system" && event.subtype === "compact_boundary" && state.compacting) {
    return { ...state, compacting: false };
  }
  if (event.type === "system" && event.subtype === "api_retry") {
    return { ...state, retry: apiRetry(event) };
  }
  if (event.type === "system" && event.subtype === "init") {
    const large = String(event.model ?? "").includes("[1m]");
    return {
      ...state,
      exit: null,
      contextWindow: large ? LARGE_CONTEXT_WINDOW : state.contextWindow,
    };
  }
  if (event.type === "stream_event") {
    const stream = (event.event ?? {}) as StreamEvent;
    const blocks = applyStream(state.blocks, stream);
    const counted = countTokens(state.tokens, stream);
    const tokens = counted === state.tokens ? counted : withPeak(counted);
    const retry = stream.type === "message_start" ? null : state.retry;
    return blocks === state.blocks && tokens === state.tokens && retry === state.retry
      ? state
      : { ...state, blocks, tokens, retry };
  }
  if (event.type === "system" && event.subtype === "thinking_tokens") {
    const thinking = Number(event.estimated_tokens ?? 0);
    return { ...state, tokens: withPeak({ ...state.tokens, thinking }) };
  }
  if (event.type === "user") {
    return { ...state, entries: [...state.entries, normalize(event)].slice(-KEPT_ENTRIES) };
  }
  if (event.type === "assistant") {
    const content = (event.message as { content?: { type?: string }[] } | undefined)?.content;
    const finished = new Set(content?.map((block) => LIVE_KIND[block.type ?? ""]));
    return {
      ...state,
      entries: [...state.entries, normalize(event)].slice(-KEPT_ENTRIES),
      blocks: state.blocks.filter((block) => !finished.has(block.kind)),
    };
  }
  if (event.type === "result") {
    const usage = Object.values(
      (event.modelUsage ?? {}) as Record<string, { contextWindow?: number }>,
    );
    const contextWindow = usage.find((model) => model.contextWindow)?.contextWindow;
    return {
      ...state,
      blocks: [],
      tokens: NO_TOKENS,
      retry: null,
      compacting: false,
      contextWindow: contextWindow ?? state.contextWindow,
    };
  }
  return state;
}

export function mergeEntries(
  transcript: readonly unknown[],
  live: readonly Record<string, unknown>[],
): unknown[] {
  if (live.length === 0) return transcript as unknown[];
  const known = new Set(transcript.map((entry) => (entry as { uuid?: string }).uuid));
  return [...transcript, ...live.filter((entry) => !known.has(entry.uuid as string))];
}

export function partialField(json: string, field: string): string {
  const match = json.match(new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`));
  if (!match) return "";
  try {
    return JSON.parse(`"${match[1]}"`) as string;
  } catch {
    return match[1];
  }
}
