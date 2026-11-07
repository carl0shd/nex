export type McpStatus = "connected" | "pending" | "needs-auth" | "failed" | "disabled";

export interface McpServer {
  name: string;
  status: McpStatus;
  source: string;
  tools: number;
  error: string | null;
}

interface RawServer {
  name?: string;
  status?: string;
  source?: string;
  scope?: string;
  tools?: unknown[];
  error?: string;
}

const STATUSES = new Set<McpStatus>(["connected", "pending", "needs-auth", "failed", "disabled"]);

export function toMcpServers(raw: unknown): McpServer[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawServer[])
    .filter((server) => server.name)
    .map((server) => ({
      name: String(server.name),
      status: STATUSES.has(server.status as McpStatus) ? (server.status as McpStatus) : "pending",
      source: server.source ?? server.scope ?? "user",
      tools: Array.isArray(server.tools) ? server.tools.length : 0,
      error: server.error ?? null,
    }));
}

const REMOVABLE_SOURCES = new Set(["user", "local", "project"]);

export const isRemovable = (server: McpServer) => REMOVABLE_SOURCES.has(server.source);

export interface McpAddInput {
  name: string;
  target: string;
}

const MCP_NAME = /^[\w-]+$/;
const REMOTE = /^https?:\/\//i;

export function isMcpServerName(name: string): boolean {
  return MCP_NAME.test(name.trim());
}

export function splitCommand(command: string): string[] {
  const words: string[] = [];
  let word = "";
  let quote: string | null = null;
  let started = false;
  for (const char of command) {
    if (quote) {
      if (char === quote) quote = null;
      else word += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (/\s/.test(char)) {
      if (started || word) words.push(word);
      word = "";
      started = false;
    } else {
      word += char;
    }
  }
  if (started || word) words.push(word);
  return words;
}

export function mcpAddArgs({ name, target }: McpAddInput): string[] {
  const server = name.trim();
  const source = target.trim();
  if (!isMcpServerName(server)) throw new Error("Use letters, numbers, - or _ for the name");
  if (!source) throw new Error("Add a command or a URL");
  if (REMOTE.test(source)) {
    return ["mcp", "add", "--scope", "project", "--transport", "http", server, source];
  }
  return ["mcp", "add", "--scope", "project", server, "--", ...splitCommand(source)];
}
