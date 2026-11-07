export interface ToolResult {
  text: string;
  isError: boolean;
  data: Record<string, unknown> | null;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: ToolResult;
  startedAt?: string;
  endedAt?: string;
  backgroundStatus?: string;
}

export type TodoStatus = "completed" | "in_progress" | "pending";

export interface Todo {
  label: string;
  status: TodoStatus;
}

export type ConversationItem =
  | { kind: "user"; id: string; text: string; images?: string[] }
  | { kind: "text"; id: string; text: string; at?: string }
  | { kind: "tool"; id: string; call: ToolCall }
  | { kind: "reads"; id: string; calls: ToolCall[] }
  | { kind: "todos"; id: string; todos: Todo[] }
  | { kind: "command"; id: string; name: string; output?: string }
  | { kind: "divider"; id: string; label: string }
  | { kind: "compacted"; id: string; before?: number; after?: number; summary?: string }
  | { kind: "thought"; id: string; text: string; seconds: number }
  | { kind: "agents"; id: string; calls: ToolCall[] }
  | { kind: "limit"; id: string; text: string };

interface RawBlock {
  type?: string;
  text?: string;
  thinking?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: unknown;
  is_error?: boolean;
  source?: { type?: string; media_type?: string; data?: string };
}

interface RawEntry {
  type?: string;
  subtype?: string;
  content?: unknown;
  uuid?: string;
  timestamp?: string;
  isMeta?: boolean;
  isCompactSummary?: boolean;
  isApiErrorMessage?: boolean;
  compactMetadata?: { preTokens?: number; postTokens?: number };
  toolUseResult?: unknown;
  message?: { content?: string | RawBlock[] };
}

const NOTIFICATION_TOOL = /<tool-use-id>([^<]+)<\/tool-use-id>/;
const NOTIFICATION_STATUS = /<status>([^<]+)<\/status>/;
const COMPACTED = /^Compacted/;
const NOTABLE_THOUGHT_SECONDS = 5;
const USAGE_LIMIT = /usage limit|hit your limit|limit reached/i;
const AGENT_TOOLS = new Set(["Task", "Agent"]);

const INTERRUPTED = /^\[Request interrupted by user/;
const HIDDEN_USER_TEXT =
  /^<(local-command-|system-reminder|bash-|task-notification|user-prompt-submit)/;
const COMMAND_NAME = /<command-name>\/?([^<]+)<\/command-name>/;
const COMMAND_OUTPUT = /<local-command-std(?:out|err)>([\s\S]*?)<\/local-command-std(?:out|err)>/;
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[ -/]*[@-~]`, "g");
const COMMAND_ARGS = /<command-args>([^<]*)<\/command-args>/;

function blockText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((block: RawBlock) => block.type === "text" && block.text)
    .map((block: RawBlock) => block.text)
    .join("\n");
}

function userItem(id: string, text: string, entry: RawEntry): ConversationItem | null {
  const trimmed = text.trim();
  if (!trimmed || entry.isMeta) return null;
  if (entry.isCompactSummary) return { kind: "compacted", id, summary: trimmed };
  if (INTERRUPTED.test(trimmed)) return { kind: "divider", id, label: "Interrupted by you" };
  const command = trimmed.match(COMMAND_NAME);
  if (command?.[1].trim() === "clear")
    return { kind: "divider", id, label: "Conversation cleared" };
  if (command) {
    const args = trimmed.match(COMMAND_ARGS)?.[1].trim();
    return { kind: "command", id, name: `/${command[1].trim()}${args ? ` ${args}` : ""}` };
  }
  if (HIDDEN_USER_TEXT.test(trimmed)) return null;
  return { kind: "user", id, text: trimmed };
}

function todosFrom(input: Record<string, unknown>): Todo[] {
  const todos = Array.isArray(input.todos) ? input.todos : [];
  return todos.map((todo: { content?: string; activeForm?: string; status?: TodoStatus }) => ({
    label: todo.content ?? todo.activeForm ?? "",
    status: todo.status ?? "pending",
  }));
}

function groupReads(items: ConversationItem[]): ConversationItem[] {
  const grouped: ConversationItem[] = [];
  for (const item of items) {
    const previous = grouped.at(-1);
    const isRead = item.kind === "tool" && item.call.name === "Read" && item.call.result;
    if (isRead && previous?.kind === "reads") {
      previous.calls.push(item.call);
      continue;
    }
    if (
      isRead &&
      previous?.kind === "tool" &&
      previous.call.name === "Read" &&
      previous.call.result
    ) {
      grouped[grouped.length - 1] = {
        kind: "reads",
        id: previous.id,
        calls: [previous.call, item.call],
      };
      continue;
    }
    grouped.push(item);
  }
  return grouped;
}

function groupAgents(items: ConversationItem[]): ConversationItem[] {
  const grouped: ConversationItem[] = [];
  for (const item of items) {
    const previous = grouped.at(-1);
    const isAgent = item.kind === "tool" && AGENT_TOOLS.has(item.call.name);
    if (isAgent && previous?.kind === "agents") {
      previous.calls.push(item.call);
      continue;
    }
    if (isAgent && previous?.kind === "tool" && AGENT_TOOLS.has(previous.call.name)) {
      grouped[grouped.length - 1] = {
        kind: "agents",
        id: previous.id,
        calls: [previous.call, item.call],
      };
      continue;
    }
    grouped.push(item);
  }
  return grouped;
}

const secondsBetween = (from: string | undefined, to: string | undefined) =>
  from && to ? Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 1000)) : 0;

function commandOutput(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const output = text.match(COMMAND_OUTPUT)?.[1].replace(ANSI, "").trim();
  return output || null;
}

export function buildConversation(entries: readonly unknown[]): ConversationItem[] {
  const items: ConversationItem[] = [];
  const attachOutput = (output: string | null) => {
    const last = items.at(-1);
    if (output && last?.kind === "command") last.output = output;
  };
  const calls = new Map<string, ToolCall>();
  let todosItem: Extract<ConversationItem, { kind: "todos" }> | null = null;
  let previousAt: string | undefined;

  entries.forEach((raw, index) => {
    const entry = raw as RawEntry;
    const id = entry.uuid ?? `entry-${index}`;
    const content = entry.message?.content;
    const startedAt = previousAt;
    if (entry.timestamp) previousAt = entry.timestamp;

    if (entry.type === "system" && entry.subtype === "local_command") {
      attachOutput(commandOutput(entry.content));
      return;
    }
    if (entry.type === "system" && entry.subtype === "compact_boundary") {
      items.push({
        kind: "compacted",
        id,
        before: entry.compactMetadata?.preTokens,
        after: entry.compactMetadata?.postTokens,
      });
      return;
    }

    if (entry.type === "user") {
      const notification = (typeof content === "string" ? content : blockText(content)).match(
        NOTIFICATION_TOOL,
      );
      if (notification) {
        const call = calls.get(notification[1]);
        const text = typeof content === "string" ? content : blockText(content);
        if (call) call.backgroundStatus = text.match(NOTIFICATION_STATUS)?.[1] ?? "completed";
        return;
      }
      if (typeof content === "string" && COMMAND_OUTPUT.test(content)) {
        attachOutput(commandOutput(content));
        return;
      }
      if (typeof content === "string") {
        const item = userItem(id, content, entry);
        const last = items.at(-1);
        if (item?.kind === "compacted" && last?.kind === "compacted" && !last.summary) {
          last.summary = item.summary;
        } else if (item) items.push(item);
        return;
      }
      const blocks = Array.isArray(content) ? content : [];
      const results = blocks.filter((block) => block.type === "tool_result");
      for (const block of results) {
        const call = block.tool_use_id ? calls.get(block.tool_use_id) : undefined;
        if (!call) continue;
        const data =
          results.length === 1 && entry.toolUseResult && typeof entry.toolUseResult === "object"
            ? (entry.toolUseResult as Record<string, unknown>)
            : null;
        call.result = { text: blockText(block.content), isError: Boolean(block.is_error), data };
        call.endedAt = entry.timestamp;
      }
      if (results.length === 0) {
        const images = blocks
          .filter((block) => block.type === "image" && block.source?.data)
          .map(
            (block) =>
              `data:${block.source?.media_type ?? "image/png"};base64,${block.source?.data}`,
          );
        const item = userItem(id, blockText(blocks), entry);
        if (item?.kind === "user" && images.length) item.images = images;
        else if (!item && images.length && !entry.isMeta) {
          items.push({ kind: "user", id, text: "", images });
        }
        if (item) items.push(item);
      }
      return;
    }

    if (entry.type !== "assistant" || !Array.isArray(content)) return;
    content.forEach((block, blockIndex) => {
      const blockId = `${id}-${blockIndex}`;
      if (block.type === "text" && block.text?.trim()) {
        const text = block.text.trim();
        if (entry.isApiErrorMessage && USAGE_LIMIT.test(text)) {
          items.push({ kind: "limit", id: blockId, text });
          return;
        }
        items.push({ kind: "text", id: blockId, text, at: entry.timestamp });
        return;
      }
      if (block.type === "thinking" || block.type === "redacted_thinking") {
        const seconds = secondsBetween(startedAt, entry.timestamp);
        if (seconds >= NOTABLE_THOUGHT_SECONDS) {
          items.push({ kind: "thought", id: blockId, text: block.thinking?.trim() ?? "", seconds });
        }
        return;
      }
      if (block.type !== "tool_use" || !block.id || !block.name) return;
      const input = block.input ?? {};
      if (block.name === "TodoWrite") {
        if (todosItem) todosItem.todos = todosFrom(input);
        else {
          todosItem = { kind: "todos", id: blockId, todos: todosFrom(input) };
          items.push(todosItem);
        }
        return;
      }
      const call: ToolCall = {
        id: block.id,
        name: block.name,
        input,
        startedAt: entry.timestamp,
      };
      calls.set(block.id, call);
      items.push({ kind: "tool", id: blockId, call });
    });
  });

  return groupAgents(groupReads(items)).filter(
    (item) =>
      !(item.kind === "command" && item.name === "/compact" && COMPACTED.test(item.output ?? "")),
  );
}

const FILE_TOOLS = new Set(["Read", "Edit", "Write", "MultiEdit", "NotebookEdit"]);
const RECENT_FILES = 8;

export function recentFiles(items: readonly ConversationItem[], cwd: string): string[] {
  const calls = items.flatMap((item) =>
    item.kind === "tool" ? [item.call] : item.kind === "reads" ? item.calls : [],
  );
  const recent: string[] = [];
  for (const call of calls.toReversed()) {
    if (!FILE_TOOLS.has(call.name) || call.result?.isError) continue;
    const path = String(call.input.file_path ?? call.input.notebook_path ?? "");
    const relative = cwd && path.startsWith(`${cwd}/`) ? path.slice(cwd.length + 1) : "";
    if (relative && !recent.includes(relative)) recent.push(relative);
    if (recent.length === RECENT_FILES) break;
  }
  return recent;
}
