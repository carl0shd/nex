import { isRemovable, type McpServer } from "@native/agents/mcp-servers";
import type { ConnectorGroup } from "@/components/composer/add-menu";

const GROUPS = [
  { id: "claude-ai", label: "claude.ai" },
  { id: "project", label: "This project" },
  { id: "user", label: "Yours" },
  { id: "plugin", label: "Plugins" },
] as const;

const VISIBLE_PER_GROUP = 4;

function groupOf(server: McpServer): (typeof GROUPS)[number]["id"] {
  if (server.name.startsWith("claude.ai") || server.name.startsWith("claude_ai"))
    return "claude-ai";
  if (server.source === "project" || server.source === "local") return "project";
  if (server.source === "plugin") return "plugin";
  return "user";
}

export function connectorName(name: string): string {
  const plain = name
    .replace(/^plugin:[^:]+:/, "")
    .replace(/^claude[._]ai[\s_]*/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
  return plain.charAt(0).toUpperCase() + plain.slice(1);
}

function detailOf(server: McpServer): string {
  switch (server.status) {
    case "connected":
      return server.tools === 1 ? "1 tool" : `${server.tools} tools`;
    case "needs-auth":
      return "Needs sign-in";
    case "failed":
      return server.error ?? "Couldn’t connect";
    case "pending":
      return "Connecting…";
    case "disabled":
      return "Off";
  }
}

export function connectorGroups(
  servers: readonly McpServer[],
  busy: ReadonlySet<string> = new Set(),
): ConnectorGroup[] {
  return GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    visible: VISIBLE_PER_GROUP,
    connectors: servers
      .filter((server) => groupOf(server) === group.id)
      .map((server) => {
        const name = connectorName(server.name);
        return {
          id: server.name,
          name,
          logo: { letter: name.charAt(0) || "?" },
          detail: detailOf(server),
          enabled: server.status !== "disabled",
          failed: server.status === "failed" || server.status === "needs-auth",
          needsSignIn: server.status === "needs-auth",
          removable: isRemovable(server),
          busy: busy.has(server.name),
        };
      }),
  })).filter((group) => group.connectors.length > 0);
}
