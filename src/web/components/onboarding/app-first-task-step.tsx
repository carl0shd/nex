import { useEffect, useState } from "react";
import type { Agent, AgentAccount } from "@native/db/types";
import {
  FirstTaskStep,
  type FirstTaskDraft,
  type FirstTaskProgress,
} from "@/components/onboarding/first-task-step";
import type { Effort } from "@/components/composer/effort";
import { resolveModel } from "@/components/composer/models";
import type { PermissionMode } from "@/components/composer/permission-menu";
import { useAgentModels } from "@/hooks/use-agent-models";
import { accountLabel } from "@/lib/accounts";
import { notifyCompact } from "@/lib/notify";
import { PERMISSION_LABEL } from "@/lib/permission-modes";
import { taskSlug, uniqueSlug } from "@/lib/task-branch";
import { workspaceImageUrl } from "@/lib/workspace-image";
import { useOnboardingStore } from "@/stores/onboarding.store";
import { usePreferencesStore } from "@/stores/preferences.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

const CLAUDE_SLUG = "claude-code";
const STARTED_PAUSE_MS = 900;

interface Setup {
  agent: Agent;
  accounts: AgentAccount[];
  account: AgentAccount | null;
  branches: string[];
}

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
    accounts: own,
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
  const prefs = usePreferencesStore((s) => s.prefs);
  const models = useAgentModels();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [model, setModel] = useState(prefs.model);
  const [effort, setEffort] = useState<Effort>(prefs.effort as Effort);
  const [mode, setMode] = useState<PermissionMode>(prefs.permissions as PermissionMode);

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
  const account = setup.accounts.find((item) => item.id === accountId) ?? setup.account;
  const modelId = resolveModel(models, model)?.id ?? model;

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
        accountId: account?.id,
        prompt: draft.message.trim() || draft.title.trim(),
        agentSettings: { model: modelId, effort, mode },
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
        account: account ? accountLabel(account) : "Claude Code",
        mode: PERMISSION_LABEL[mode],
        branchPrefix: prefix,
      }}
      settings={{
        accounts: setup.accounts.map((item) => ({ id: item.id, label: accountLabel(item) })),
        account: account?.id ?? "",
        onAccount: setAccountId,
        models,
        model: modelId,
        onModel: setModel,
        effort,
        onEffort: setEffort,
        mode,
        onMode: setMode,
      }}
      onBack={onBack}
      onSkip={onDone}
      onStart={() => void start()}
    />
  );
}
