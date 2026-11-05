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
