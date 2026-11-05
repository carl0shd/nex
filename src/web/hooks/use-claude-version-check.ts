import { useEffect } from "react";
import { MIN_CLAUDE_VERSION, claudeCompat } from "@/lib/claude-version";
import { notify, notifyCompact } from "@/lib/notify";

const CLAUDE_SLUG = "claude-code";

export async function upgradeClaude(agentId: string): Promise<string | null> {
  const toast = notify({
    tone: "neutral",
    status: "Updating",
    working: true,
    title: "Updating Claude Code",
  });
  const version = await window.api.upgradeAgent(agentId);
  notifyCompact(
    version && claudeCompat(version) !== "outdated"
      ? { tone: "green", title: `Claude Code is on v${version}` }
      : { tone: "red", title: "Couldn’t update Claude Code" },
    { id: toast },
  );
  return version;
}

export function useClaudeVersionCheck() {
  useEffect(() => {
    void (async () => {
      const agents = await window.api.getAgents();
      const claude = agents.find((agent) => agent.slug === CLAUDE_SLUG);
      if (!claude) return;
      const version = await window.api.getAgentVersion(claude.id);
      if (!version || claudeCompat(version) !== "outdated") return;
      notify({
        tone: "orange",
        status: "Claude Code",
        title: `Claude Code v${version} is too old for Nex`,
        body: `Nex needs v${MIN_CLAUDE_VERSION} or newer to run agents reliably.`,
        actions: [
          { label: "Update", kind: "neutral", onClick: () => void upgradeClaude(claude.id) },
          { label: "Later", kind: "ghost" },
        ],
      });
    })();
  }, []);
}
