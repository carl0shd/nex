import { useEffect, useState } from "react";
import type { Agent, AgentAccount } from "@native/db/types";
import {
  FirstTaskStep,
  type FirstTaskDraft,
  type FirstTaskProgress,
} from "@/components/onboarding/first-task-step";
import { notifyCompact } from "@/lib/notify";
import { taskSlug, uniqueSlug } from "@/lib/task-branch";
import { workspaceImageUrl } from "@/lib/workspace-image";
import { useOnboardingStore } from "@/stores/onboarding.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

const CLAUDE_SLUG = "claude-code";
const STARTED_PAUSE_MS = 900;

interface Setup {
  agent: Agent;
  account: AgentAccount | null;
  branches: string[];
}

const accountLabel = (account: AgentAccount) =>
  account.email ? account.name : (account.name.split("@")[0] ?? account.name);

async function loadSetup(projectPath: string): Promise<Setup | null> {
  const [agents, accounts, isRepo] = await Promise.all([
    window.api.getAgents(),
    window.api.getAgentAccounts(),
    window.api.isGitRepo(projectPath),
  ]);
  const agent = agents.find((item) => item.slug === CLAUDE_SLUG);
  if (!agent) return null;
  const own = accounts.filter((account) => account.agentId === agent.id);
  return {
    agent,
    account: own.find((account) => account.isDefault) ?? own[0] ?? null,
    branches: isRepo ? await window.api.listBranches(projectPath) : [],
  };
}

export function AppFirstTaskStep({
  projectId,
  onBack,
  onDone,
}: {
  projectId: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const project = useWorkspaceStore((s) => s.projects.find((item) => item.id === projectId));
  const workspace = useWorkspaceStore((s) =>
    s.workspaces.find((item) => item.id === project?.workspaceId),
  );
  const startTask = useWorkspaceStore((s) => s.startTask);
  const markFirstTaskStarted = useOnboardingStore((s) => s.markFirstTaskStarted);
  const setAddAgentHint = useSettingsStore((s) => s.setAddAgentHint);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [draft, setDraft] = useState<FirstTaskDraft>({ title: "", message: "" });
  const [progress, setProgress] = useState<FirstTaskProgress>("idle");

  const projectPath = project?.path;
  useEffect(() => {
    if (!projectPath) return;
    let cancelled = false;
    void loadSetup(projectPath).then((next) => !cancelled && setSetup(next));
    return () => {
      cancelled = true;
    };
  }, [projectPath]);

  if (!project || !workspace || !setup) return null;

  const prefix = project.branchPrefix.replace(/\/+$/, "");

  const start = async () => {
    const taken = new Set(
      setup.branches
        .filter((branch) => !prefix || branch.startsWith(`${prefix}/`))
        .map((branch) => (prefix ? branch.slice(prefix.length + 1) : branch)),
    );
    setProgress("starting");
    try {
      await startTask({
        projectId: project.id,
        name: uniqueSlug(taskSlug(draft.title), taken),
        title: draft.title.trim(),
        agentId: setup.agent.id,
        accountId: setup.account?.id,
        prompt: draft.message.trim() || draft.title.trim(),
      });
      setProgress("started");
      markFirstTaskStarted(true);
      setAddAgentHint(true);
      setTimeout(onDone, STARTED_PAUSE_MS);
    } catch (error) {
      setProgress("idle");
      notifyCompact({
        tone: "red",
        title: error instanceof Error ? error.message : "Couldn’t start the task",
      });
    }
  };

  return (
    <FirstTaskStep
      draft={draft}
      onChange={setDraft}
      progress={progress}
      context={{
        project: project.name,
        workspace: {
          name: workspace.name,
          color: workspace.color,
          image: workspaceImageUrl(workspace.customImage),
        },
        account: setup.account ? accountLabel(setup.account) : "Claude Code",
        mode: "Ask first",
        branchPrefix: prefix,
      }}
      onBack={onBack}
      onSkip={onDone}
      onStart={() => void start()}
    />
  );
}
