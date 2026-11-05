import { useEffect, useState } from "react";
import type { AvailableAgent } from "@native/agents/detect";
import type { Agent, AgentAccount } from "@native/db/types";
import { AgentStep, type ClaudeInstall } from "@/components/onboarding/agent-step";
import { AppAddAccount } from "@/components/onboarding/app-add-account";
import { notifyCompact } from "@/lib/notify";

const CLAUDE_SLUG = "claude-code";
const INSTALL_COMMAND = "curl -fsSL https://claude.ai/install.sh | bash";
const RECHECK_MS = 3000;

interface Scan {
  install: ClaudeInstall;
  git: string | null;
  took: string;
  registered: boolean;
}

function toInstall(
  available: AvailableAgent | undefined,
  agent: Agent | undefined,
  accounts: AgentAccount[],
): ClaudeInstall {
  if (!available?.command) return { state: "missing", installCommand: INSTALL_COMMAND };
  const version = available.version ?? "unknown";
  const saved = accounts.filter((account) => account.agentId === agent?.id);
  const signedIn = saved.length
    ? saved.map((account) => ({
        id: account.id,
        name: account.email ? account.name : (account.name.split("@")[0] ?? account.name),
        email: account.email ?? account.name,
        color: account.color ?? "var(--accent)",
        usedPercent: 0,
        isDefault: account.isDefault,
      }))
    : available.suggestedAccount
      ? [
          {
            id: available.suggestedAccount.name,
            name: available.suggestedAccount.name.split("@")[0] ?? available.suggestedAccount.name,
            email: available.suggestedAccount.name,
            color: "var(--accent)",
            usedPercent: 0,
            isDefault: true,
          },
        ]
      : [];
  if (signedIn.length === 0) return { state: "signed-out", version, path: available.command };
  return { state: "ready", version, path: available.command, accounts: signedIn };
}

function formatScanTime(ms: number) {
  return ms < 100 ? "under 0.1s" : `${(ms / 1000).toFixed(1)}s`;
}

async function scan(): Promise<Scan> {
  const startedAt = performance.now();
  const [available, git, agents, accounts] = await Promise.all([
    window.api.detectAgents(),
    window.api.detectGit(),
    window.api.getAgents(),
    window.api.getAgentAccounts(),
  ]);
  const agent = agents.find((item) => item.slug === CLAUDE_SLUG);
  return {
    install: toInstall(
      available.find((item) => item.slug === CLAUDE_SLUG),
      agent,
      accounts,
    ),
    git: git.version,
    took: formatScanTime(performance.now() - startedAt),
    registered: Boolean(agent && accounts.some((account) => account.agentId === agent.id)),
  };
}

export function AppAgentStep({
  onBack,
  onContinue,
}: {
  onBack: () => void;
  onContinue: () => void;
}) {
  const [result, setResult] = useState<Scan | null>(null);
  const [continuing, setContinuing] = useState(false);
  const [adding, setAdding] = useState(false);
  const ready = result?.install.state === "ready" && Boolean(result.git);

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    const run = () =>
      void scan().then((next) => {
        if (!cancelled) setResult(next);
      });
    run();
    const timer = setInterval(run, RECHECK_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [ready]);

  if (!result) return null;

  const proceed = async () => {
    if (result.registered) return onContinue();
    setContinuing(true);
    try {
      await window.api.installAgent(CLAUDE_SLUG);
      onContinue();
    } catch {
      setContinuing(false);
      notifyCompact({ tone: "red", title: "Couldn’t set up Claude Code" });
    }
  };

  const rescan = () => void scan().then(setResult);

  return (
    <>
      <AgentStep
        install={result.install}
        git={result.git}
        scanTime={result.took}
        continuing={continuing}
        onBack={onBack}
        onContinue={() => void proceed()}
        onAddAccount={() => setAdding(true)}
        onSignIn={() => setAdding(true)}
      />
      {adding && <AppAddAccount onClose={() => setAdding(false)} onAdded={rescan} />}
    </>
  );
}
