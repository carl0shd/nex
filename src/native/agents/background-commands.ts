export interface BackgroundCommand {
  id: string;
  command: string;
  description: string;
  startedAt: number;
}

interface Requested {
  command: string;
  description: string;
}

export interface BackgroundState {
  commands: BackgroundCommand[];
  requested: Record<string, Requested>;
  stopping: Record<string, string>;
}

export const NO_BACKGROUND: BackgroundState = { commands: [], requested: {}, stopping: {} };

interface Block {
  type?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: unknown;
  is_error?: boolean;
  text?: string;
}

const STOP_TOOLS = new Set(["TaskStop", "KillShell", "KillBash"]);
const FINISHED = new Set(["completed", "failed", "killed", "stopped", "cancelled"]);
const STARTED_ID = /running in background with ID:\s*([\w-]+)/;
const NOTIFICATION = /<task-notification>[\s\S]*?<task-id>([^<]+)<\/task-id>/g;

const text = (value: unknown) => (typeof value === "string" ? value : "");

function blocksOf(event: Record<string, unknown>): Block[] {
  const content = (event.message as { content?: unknown } | undefined)?.content;
  if (typeof content === "string") return [{ type: "text", text: content }];
  return Array.isArray(content) ? (content as Block[]) : [];
}

function resultText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((block: Block) => text(block.text)).join("\n");
}

function upsert(state: BackgroundState, command: BackgroundCommand): BackgroundState {
  const known = state.commands.find((item) => item.id === command.id);
  if (known && known.command === command.command) return state;
  const commands = known
    ? state.commands.map((item) =>
        item.id === command.id ? { ...item, command: command.command } : item,
      )
    : [...state.commands, command];
  return { ...state, commands };
}

function remove(state: BackgroundState, ids: readonly string[]): BackgroundState {
  const commands = state.commands.filter((item) => !ids.includes(item.id));
  return commands.length === state.commands.length ? state : { ...state, commands };
}

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  const { [key]: _gone, ...rest } = record;
  return rest;
}

function applyAssistant(state: BackgroundState, blocks: Block[]): BackgroundState {
  let next = state;
  for (const block of blocks) {
    if (block.type !== "tool_use" || !block.id) continue;
    const input = block.input ?? {};
    if (block.name === "Bash" && input.run_in_background === true) {
      const requested = { command: text(input.command), description: text(input.description) };
      next = { ...next, requested: { ...next.requested, [block.id]: requested } };
    }
    const target = text(input.task_id) || text(input.shell_id) || text(input.bash_id);
    if (block.name && STOP_TOOLS.has(block.name) && target) {
      next = { ...next, stopping: { ...next.stopping, [block.id]: target } };
    }
  }
  return next;
}

function applyUser(
  state: BackgroundState,
  event: Record<string, unknown>,
  now: number,
): BackgroundState {
  let next = state;
  const data = (event.tool_use_result ?? event.toolUseResult) as
    | { backgroundTaskId?: unknown }
    | undefined;
  for (const block of blocksOf(event)) {
    if (block.type === "text") {
      const finished = [...text(block.text).matchAll(NOTIFICATION)].map((match) => match[1]);
      if (finished.length) next = remove(next, finished);
      continue;
    }
    if (block.type !== "tool_result" || !block.tool_use_id) continue;
    const useId = block.tool_use_id;
    const requested = next.requested[useId];
    if (requested) {
      next = { ...next, requested: without(next.requested, useId) };
      const id =
        text(data?.backgroundTaskId) || resultText(block.content).match(STARTED_ID)?.[1] || "";
      if (!block.is_error && id && !next.commands.some((item) => item.id === id)) {
        next = upsert(next, { id, ...requested, startedAt: now });
      }
    }
    const stopped = next.stopping[useId];
    if (stopped) {
      next = { ...next, stopping: without(next.stopping, useId) };
      if (!block.is_error) next = remove(next, [stopped]);
    }
  }
  return next;
}

interface ListedTask {
  task_id?: string;
  task_type?: string;
  description?: string;
}

function applySystem(
  state: BackgroundState,
  event: Record<string, unknown>,
  now: number,
): BackgroundState {
  const taskId = text(event.task_id);
  switch (event.subtype) {
    case "task_started": {
      if (!taskId || (event.task_type && event.task_type !== "local_bash")) return state;
      const useId = text(event.tool_use_id);
      const requested = state.requested[useId];
      const description = requested?.description || text(event.description);
      const next = upsert(state, {
        id: taskId,
        command: requested?.command || description,
        description,
        startedAt: now,
      });
      return requested ? { ...next, requested: without(next.requested, useId) } : next;
    }
    case "task_notification":
      return taskId ? remove(state, [taskId]) : state;
    case "task_updated": {
      const status = (event.patch as { status?: unknown } | undefined)?.status;
      return taskId && FINISHED.has(text(status)) ? remove(state, [taskId]) : state;
    }
    case "background_tasks_changed": {
      if (!Array.isArray(event.tasks)) return state;
      const listed = (event.tasks as ListedTask[]).filter(
        (task) => task.task_id && (!task.task_type || task.task_type === "local_bash"),
      );
      const ids = new Set(listed.map((task) => task.task_id));
      let next = remove(
        state,
        state.commands.filter((item) => !ids.has(item.id)).map((item) => item.id),
      );
      for (const task of listed) {
        if (next.commands.some((item) => item.id === task.task_id)) continue;
        const description = text(task.description);
        next = upsert(next, {
          id: String(task.task_id),
          command: description,
          description,
          startedAt: now,
        });
      }
      return next;
    }
    default:
      return state;
  }
}

export function applyBackgroundEvent(
  state: BackgroundState,
  event: Record<string, unknown>,
  now = Date.now(),
): BackgroundState {
  if (event.type === "assistant") return applyAssistant(state, blocksOf(event));
  if (event.type === "user") return applyUser(state, event, now);
  if (event.type === "system") return applySystem(state, event, now);
  return state;
}
