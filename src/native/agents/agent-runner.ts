import { execFile, spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { extraAgentArgs } from "@native/main/preferences";
import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { BrowserWindow, shell } from "electron";
import * as agentRepo from "@native/db/repositories/agent.repo";
import * as agentAccountRepo from "@native/db/repositories/agent-account.repo";
import * as sessionRepo from "@native/db/repositories/session.repo";
import * as settingsRepo from "@native/db/repositories/settings.repo";
import * as terminalRepo from "@native/db/repositories/terminal.repo";
import {
  cliEffort,
  cliFlags,
  cliMode,
  cliModel,
  modeFromCli,
  readAgentSettings,
  saveAgentSettings,
  type AgentSettings,
} from "@native/agents/agent-settings";
import { toAgentCommands, type AgentCommand } from "@native/agents/agent-commands";
import {
  modelSupportsEffort,
  rememberAgentModels,
  toAgentModels,
} from "@native/agents/agent-models";
import { isRemovable, toMcpServers, type McpServer } from "@native/agents/mcp-servers";
import { toContextUsage, type ContextUsage } from "@native/agents/context-usage";
import { rememberPastClaudeSession } from "@native/agents/agent-history";
import { transcriptPath } from "@native/agents/transcript";
import { requestPermission, dropPermissionsFor } from "@native/agents/permissions";
import { IPC } from "@native/ipc/channels";

export type AgentRunState = "running" | "idle";

export interface AgentLiveEvent {
  sessionId: string;
  event: Record<string, unknown>;
}

interface RunningAgent {
  child: ChildProcessWithoutNullStreams;
  state: AgentRunState;
  buffer: string;
  settings: AgentSettings;
  restartWhenIdle: boolean;
  claudeSessionId: string | null;
  initRequestId: string;
  cwd: string;
  command: string;
  env: Record<string, string>;
  stderr: string[];
}

export type AgentMessage = string | Record<string, unknown>[];

const commandsBySession = new Map<string, AgentCommand[]>();
const waitingResponses = new Map<string, (response: Record<string, unknown> | null) => void>();
const requestSubtypes = new Map<string, string>();
const unsupportedRequests = new Set<string>();
const UNSUPPORTED = /unsupported|unknown|not supported/i;
const CONTROL_TIMEOUT_MS = 15_000;
const STDERR_LINES = 40;
let latestCommands: AgentCommand[] = [];

const STREAM_ARGS = [
  "--print",
  "--input-format",
  "stream-json",
  "--output-format",
  "stream-json",
  "--include-partial-messages",
  "--verbose",
  "--permission-prompt-tool",
  "stdio",
  "--allow-dangerously-skip-permissions",
];

const FORWARDED = new Set(["stream_event", "assistant", "user", "result", "system"]);

const agents = new Map<string, RunningAgent>();

function broadcast(channel: string, payload: unknown) {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send(channel, payload);
}

function setState(sessionId: string, state: AgentRunState) {
  const agent = agents.get(sessionId);
  if (agent) agent.state = state;
  broadcast(IPC.AGENT_STATE, { sessionId, state });
}

function write(sessionId: string, message: unknown) {
  agents.get(sessionId)?.child.stdin.write(`${JSON.stringify(message)}\n`);
}

function control(sessionId: string, request: Record<string, unknown>) {
  write(sessionId, { type: "control_request", request_id: randomUUID(), request });
}

function agentTerminal(sessionId: string) {
  return terminalRepo.getBySession(sessionId).find((terminal) => terminal.type === "agent") ?? null;
}

// Claude Code can move a conversation to a new session id (a fork, a slash command), and the
// transcript Nex shows follows whichever id the stream last reported.
function rememberClaudeSession(sessionId: string, claudeSessionId: string) {
  const agent = agents.get(sessionId);
  if (!agent || agent.claudeSessionId === claudeSessionId) return;
  agent.claudeSessionId = claudeSessionId;
  const terminal = agentTerminal(sessionId);
  if (!terminal || terminal.agentSessionId === claudeSessionId) return;
  if (terminal.agentSessionId) rememberPastClaudeSession(sessionId, terminal.agentSessionId);
  terminalRepo.setAgentSessionId(terminal.id, claudeSessionId);
}

function claudeSessionArgs(terminalId: string): string[] {
  const terminal = terminalRepo.getById(terminalId);
  const existing = terminal?.agentSessionId;
  const transcript = transcriptPath(terminalId);
  if (existing && transcript?.endsWith(`${existing}.jsonl`)) return ["--resume", existing];
  const fresh = existing ?? randomUUID();
  if (!existing) terminalRepo.setAgentSessionId(terminalId, fresh);
  return ["--session-id", fresh];
}

async function handleControl(sessionId: string, message: Record<string, unknown>) {
  const request = message.request as Record<string, unknown> | undefined;
  const requestId = message.request_id as string;
  if (request?.subtype !== "can_use_tool") {
    write(sessionId, {
      type: "control_response",
      response: { subtype: "error", request_id: requestId, error: "Unsupported request" },
    });
    return;
  }
  const input = (request.input as Record<string, unknown>) ?? {};
  const answer = await requestPermission({
    sessionId,
    tool: String(request.tool_name ?? ""),
    input,
    suggestions: (request.permission_suggestions as unknown[]) ?? [],
  });
  const response =
    answer.behavior === "allow"
      ? {
          behavior: "allow",
          updatedInput: answer.updatedInput ?? input,
          ...(answer.remember && { updatedPermissions: request.permission_suggestions ?? [] }),
        }
      : {
          behavior: "deny",
          message: answer.message
            ? `The user denied this and said: ${answer.message}`
            : "The user denied this.",
        };
  write(sessionId, {
    type: "control_response",
    response: { subtype: "success", request_id: requestId, response },
  });
}

function handleControlResponse(sessionId: string, message: Record<string, unknown>) {
  const agent = agents.get(sessionId);
  const response = message.response as
    | {
        request_id?: string;
        subtype?: string;
        error?: unknown;
        response?: { commands?: unknown; models?: unknown };
      }
    | undefined;
  const asked = response?.request_id ? requestSubtypes.get(response.request_id) : undefined;
  if (asked && response?.subtype === "error" && UNSUPPORTED.test(String(response.error ?? ""))) {
    unsupportedRequests.add(asked);
  }
  const waiting = response?.request_id ? waitingResponses.get(response.request_id) : undefined;
  if (waiting && response?.request_id) {
    waitingResponses.delete(response.request_id);
    requestSubtypes.delete(response.request_id);
    waiting(
      response.subtype === "success"
        ? ((response.response ?? {}) as Record<string, unknown>)
        : null,
    );
    return;
  }
  if (!agent || response?.request_id !== agent.initRequestId) return;
  if (rememberAgentModels(toAgentModels(response.response?.models))) {
    broadcast(IPC.AGENT_MODELS, null);
  }
  const commands = toAgentCommands(response.response?.commands, agent.cwd);
  commandsBySession.set(sessionId, commands);
  latestCommands = commands;
  broadcast(IPC.AGENT_COMMANDS, { sessionId });
}

function handleLine(sessionId: string, line: string) {
  let message: Record<string, unknown>;
  try {
    message = JSON.parse(line) as Record<string, unknown>;
  } catch {
    return;
  }
  if (message.type === "control_request") {
    void handleControl(sessionId, message);
    return;
  }
  if (message.type === "control_response") {
    handleControlResponse(sessionId, message);
    return;
  }
  const claudeSessionId = message.session_id;
  if (typeof claudeSessionId === "string") rememberClaudeSession(sessionId, claudeSessionId);
  if (
    message.type === "system" &&
    message.subtype === "status" &&
    message.status === "requesting"
  ) {
    setState(sessionId, "running");
  }
  if (message.type === "system" && typeof message.permissionMode === "string") {
    rememberMode(sessionId, message.permissionMode);
  }
  if (message.type === "result") {
    setState(sessionId, "idle");
    if (agents.get(sessionId)?.restartWhenIdle) stopAgent(sessionId);
  }
  if (FORWARDED.has(message.type as string)) {
    broadcast(IPC.AGENT_EVENT, { sessionId, event: message } satisfies AgentLiveEvent);
  }
}

function rememberMode(sessionId: string, cli: string) {
  const agent = agents.get(sessionId);
  const mode = modeFromCli(cli);
  if (!agent || !mode || agent.settings.mode === mode) return;
  agent.settings = { ...agent.settings, mode };
  saveAgentSettings(sessionId, agent.settings);
}

function start(sessionId: string): RunningAgent {
  const running = agents.get(sessionId);
  if (running) return running;

  const session = sessionRepo.getById(sessionId);
  const agent = session?.agentId ? agentRepo.getById(session.agentId) : null;
  const terminal = agentTerminal(sessionId);
  if (!session || !agent || !terminal) throw new Error("This task has no agent to run");
  if (!existsSync(session.worktreePath)) {
    const event = { type: "nex_exit", code: null, log: "", reason: "missing-worktree" };
    broadcast(IPC.AGENT_EVENT, { sessionId, event } satisfies AgentLiveEvent);
    throw new Error("This task's worktree no longer exists");
  }
  const account = session.accountId ? agentAccountRepo.getById(session.accountId) : null;

  const env: Record<string, string> = { ...(process.env as Record<string, string>) };
  if (account && agent.configEnvVar && account.configDir !== agent.defaultConfigDir) {
    env[agent.configEnvVar] = account.configDir;
  }

  const settings = readAgentSettings(sessionId);
  const child = spawn(
    agent.command,
    [
      ...STREAM_ARGS,
      ...cliFlags(settings, modelSupportsEffort(cliModel(settings.model))),
      ...claudeSessionArgs(terminal.id),
      ...agent.args,
      ...extraAgentArgs(),
    ],
    { cwd: session.worktreePath, env },
  );
  const entry: RunningAgent = {
    child,
    state: "idle",
    buffer: "",
    settings,
    restartWhenIdle: false,
    claudeSessionId: null,
    initRequestId: randomUUID(),
    cwd: session.worktreePath,
    command: agent.command,
    env,
    stderr: [],
  };
  agents.set(sessionId, entry);

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    entry.buffer += chunk;
    let newline = entry.buffer.indexOf("\n");
    while (newline >= 0) {
      const line = entry.buffer.slice(0, newline).trim();
      entry.buffer = entry.buffer.slice(newline + 1);
      if (line) handleLine(sessionId, line);
      newline = entry.buffer.indexOf("\n");
    }
  });
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    entry.stderr = [...entry.stderr, ...chunk.split("\n").filter(Boolean)].slice(-STDERR_LINES);
  });
  child.stdin.on("error", () => {});
  const ended = (code: number | null) => {
    if (agents.get(sessionId) !== entry) return;
    agents.delete(sessionId);
    dropPermissionsFor(sessionId);
    setState(sessionId, "idle");
    if (code === 0) return;
    const event = { type: "nex_exit", code, log: entry.stderr.join("\n") };
    broadcast(IPC.AGENT_EVENT, { sessionId, event } satisfies AgentLiveEvent);
  };
  child.on("error", () => ended(null));
  child.on("exit", (code) => ended(code));

  write(sessionId, {
    type: "control_request",
    request_id: entry.initRequestId,
    request: { subtype: "initialize", hooks: null },
  });
  return entry;
}

const isSlashCommand = (content: AgentMessage) =>
  typeof content === "string" && content.trimStart().startsWith("/");

export function sendToAgent(sessionId: string, content: AgentMessage): void {
  start(sessionId);
  write(sessionId, { type: "user", message: { role: "user", content } });
  if (!isSlashCommand(content)) setState(sessionId, "running");
}

export function warmAgent(sessionId: string): void {
  try {
    start(sessionId);
  } catch {
    /* a task without an agent has nothing to warm */
  }
}

export function agentCommands(sessionId: string): AgentCommand[] {
  return commandsBySession.get(sessionId) ?? latestCommands;
}

export function interruptAgent(sessionId: string): void {
  if (!agents.has(sessionId)) return;
  control(sessionId, { subtype: "interrupt" });
  setState(sessionId, "idle");
}

export function configureAgent(sessionId: string, settings: AgentSettings): void {
  saveAgentSettings(sessionId, settings);
  const agent = agents.get(sessionId);
  if (!agent) return;
  const before = agent.settings;
  agent.settings = settings;
  const restart = () => {
    if (agent.state === "idle") stopAgent(sessionId);
    else agent.restartWhenIdle = true;
  };
  const live: Promise<Record<string, unknown> | null>[] = [];
  if (before.model !== settings.model) {
    live.push(ask(sessionId, { subtype: "set_model", model: cliModel(settings.model) }));
  }
  if (before.mode !== settings.mode) {
    live.push(ask(sessionId, { subtype: "set_permission_mode", mode: cliMode(settings.mode) }));
  }
  if (cliEffort(before.effort) !== cliEffort(settings.effort)) return restart();
  void Promise.all(live).then((answers) => {
    if (answers.some((answer) => answer === null) && agents.get(sessionId) === agent) restart();
  });
}

function ask(sessionId: string, request: Record<string, unknown>) {
  const subtype = String(request.subtype);
  if (unsupportedRequests.has(subtype)) return Promise.resolve(null);
  start(sessionId);
  const requestId = randomUUID();
  requestSubtypes.set(requestId, subtype);
  return new Promise<Record<string, unknown> | null>((resolve) => {
    const timer = setTimeout(() => {
      waitingResponses.delete(requestId);
      requestSubtypes.delete(requestId);
      resolve(null);
    }, CONTROL_TIMEOUT_MS);
    waitingResponses.set(requestId, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
    write(sessionId, { type: "control_request", request_id: requestId, request });
  });
}

const contextKey = (sessionId: string) => `agent-context:${sessionId}`;

export async function agentContext(sessionId: string): Promise<ContextUsage | null> {
  const usage = toContextUsage(await ask(sessionId, { subtype: "get_context_usage" }));
  if (usage) settingsRepo.set(contextKey(sessionId), usage);
  return usage ?? lastAgentContext(sessionId);
}

export function lastAgentContext(sessionId: string): ContextUsage | null {
  return settingsRepo.get<ContextUsage | null>(contextKey(sessionId), null);
}

export async function mcpStatus(sessionId: string): Promise<McpServer[]> {
  const response = await ask(sessionId, { subtype: "mcp_status" });
  return toMcpServers(response?.mcpServers);
}

export async function mcpToggle(sessionId: string, name: string, enabled: boolean) {
  await ask(sessionId, { subtype: "mcp_toggle", serverName: name, enabled });
  return mcpStatus(sessionId);
}

export async function mcpReconnect(sessionId: string, name: string) {
  await ask(sessionId, { subtype: "mcp_reconnect", serverName: name });
  return mcpStatus(sessionId);
}

const SIGN_IN_TIMEOUT_MS = 180_000;
const SIGN_IN_POLL_MS = 2_000;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mcpSignIn(sessionId: string, name: string): Promise<McpServer[]> {
  const response = await ask(sessionId, { subtype: "mcp_authenticate", serverName: name });
  if (typeof response?.authUrl !== "string") return mcpReconnect(sessionId, name);
  void shell.openExternal(response.authUrl);
  const reconnectEachTime = response.callbackExpected === false;
  const deadline = Date.now() + SIGN_IN_TIMEOUT_MS;
  while (Date.now() < deadline && agents.has(sessionId)) {
    await pause(SIGN_IN_POLL_MS);
    const servers = reconnectEachTime
      ? await mcpReconnect(sessionId, name)
      : await mcpStatus(sessionId);
    if (servers.find((server) => server.name === name)?.status === "connected") return servers;
  }
  return mcpStatus(sessionId);
}

export async function mcpRemove(sessionId: string, name: string): Promise<McpServer[]> {
  const server = (await mcpStatus(sessionId)).find((item) => item.name === name);
  if (!server || !isRemovable(server)) return mcpToggle(sessionId, name, false);
  const agent = start(sessionId);
  await new Promise<void>((resolve, reject) =>
    execFile(
      agent.command,
      ["mcp", "remove", name, "--scope", server.source],
      { cwd: agent.cwd, env: agent.env },
      (error) => (error ? reject(error) : resolve()),
    ),
  );
  if (agent.state === "idle") stopAgent(sessionId);
  else agent.restartWhenIdle = true;
  return (await mcpStatus(sessionId)).filter((item) => item.name !== name);
}

export function agentStates(): Record<string, AgentRunState> {
  return Object.fromEntries([...agents].map(([sessionId, agent]) => [sessionId, agent.state]));
}

export function stopAgent(sessionId: string): void {
  const agent = agents.get(sessionId);
  if (!agent) return;
  agents.delete(sessionId);
  agent.child.kill();
  dropPermissionsFor(sessionId);
}

export function stopAllAgents(): void {
  for (const sessionId of [...agents.keys()]) stopAgent(sessionId);
}
