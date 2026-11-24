import { useEffect, useState } from "react";
import { agentDisplayName } from "@native/agents/agent-display";
import type { Agent, AgentAccount, Project, Workspace } from "@native/db/types";
import type { AccountUsage } from "@native/usage/types";
import type { AgentKind } from "@/components/atoms/agent-logo";
import type { Effort } from "@/components/composer/effort";
import type { PermissionMode } from "@/components/composer/permission-menu";
import type { AgentOption } from "@/components/new-task/agent-picker";
import type { NewTaskProject } from "@/components/new-task/place-pickers";
import { useAgentModels } from "@/hooks/use-agent-models";
import type { NewTaskDraft } from "@/hooks/use-task-fields";
import { agentMessage } from "@/lib/agent-message";
import { ipcErrorMessage } from "@/lib/ipc-error";
import { notify, notifyCompact } from "@/lib/notify";
import { taskSlug, uniqueSlug, withBranchPrefix } from "@/lib/task-branch";
import { activeLimit, type AccountLimits } from "@/lib/usage";
import { workspaceIcon } from "@/lib/workspace-icons";
import { workspaceImageUrl } from "@/lib/workspace-image";
import { useEnvironmentsStore } from "@/stores/environments.store";
import { usePreferencesStore } from "@/stores/preferences.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

type ProjectBranches = Record<string, string[]>;

function agentKind(slug: string): AgentKind {
  if (slug.startsWith("claude")) return "claude";
  return "shell";
}

const SHELL_ONLY: AgentOption = {
  id: "shell",
  name: "Shell only",
  detail: "A plain terminal, no agent",
  installed: true,
};

type AgentVersions = Record<string, string | null>;

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

function agentOptions(
  agents: Agent[],
  accounts: AgentAccount[],
  versions: AgentVersions,
  usage: AccountUsage[],
): AgentOption[] {
  const options = agents.map((agent) => {
    const version = versions[agent.id];
    return {
      id: agentKind(agent.slug),
      name: agentDisplayName(agent.slug, agent.name),
      shortName: agentKind(agent.slug) === "claude" ? "Claude" : undefined,
      detail: version ? `v${version}` : "",
      installed: true,
      accounts: accounts
        .filter((account) => account.agentId === agent.id)
        .toSorted((a, b) => Number(b.isDefault) - Number(a.isDefault))
        .map((account) => {
          const limits = usage.find((item) => item.accountId === account.id);
          return {
            id: account.id,
            name: account.name,
            plan: limits?.subscriptionType ? capitalize(limits.subscriptionType) : undefined,
            usedPercent: usedPercent(limits),
          };
        }),
    };
  });
  return [...options, SHELL_ONLY];
}

function usedPercent(limits: AccountLimits | undefined): number | undefined {
  const percent = limits ? activeLimit(limits).percent : null;
  return percent === null ? undefined : Math.round(percent);
}

async function loadBranches(projects: Project[]): Promise<ProjectBranches> {
  const entries = await Promise.all(
    projects.map(async (project): Promise<[string, string[]]> => {
      if (!(await window.api.isGitRepo(project.path))) return [project.id, []];
      const [detected, branches] = await Promise.all([
        window.api.detectBaseBranch(project.path),
        window.api.listBranches(project.path),
      ]);
      const base = project.baseBranch || detected;
      return [project.id, [base, ...branches.filter((branch) => branch !== base)]];
    }),
  );
  return Object.fromEntries(entries);
}

function toDialogProjects(
  projects: Project[],
  workspaces: Workspace[],
  branches: ProjectBranches,
  environmentsOn: boolean,
): NewTaskProject[] {
  return workspaces
    .filter((workspace) => !workspace.archived)
    .flatMap((workspace) =>
      projects
        .filter((project) => project.workspaceId === workspace.id)
        .map((project) => ({
          id: project.id,
          name: project.name,
          workspace: {
            id: workspace.id,
            name: workspace.name,
            color: workspace.color,
            image: workspaceImageUrl(workspace.customImage),
            icon: workspaceIcon(workspace.icon),
          },
          branches: branches[project.id] ?? [],
          branchPrefix: project.branchPrefix,
          environment: environmentsOn && (project.environment?.services.length ?? 0) > 0,
        })),
    );
}

export type NewTaskLauncher = NonNullable<ReturnType<typeof useNewTaskLauncher>>;

export function useNewTaskLauncher(onStarted?: () => void) {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const sessions = useWorkspaceStore((s) => s.sessions);
  const startTask = useWorkspaceStore((s) => s.startTask);
  const setAddAgentHint = useSettingsStore((s) => s.setAddAgentHint);
  const prefs = usePreferencesStore((s) => s.prefs);
  const environmentsOn = useEnvironmentsStore((s) => s.status?.enabled ?? false);
  const models = useAgentModels();
  const [data, setData] = useState<{
    branches: ProjectBranches;
    agents: Agent[];
    accounts: AgentAccount[];
  } | null>(null);
  const [starting, setStarting] = useState(false);
  const [versions, setVersions] = useState<AgentVersions>({});
  const [usage, setUsage] = useState<AccountUsage[]>([]);

  useEffect(() => {
    let cancelled = false;
    void window.api.usage
      .getSummary()
      .then((summary) => !cancelled && setUsage(summary.accounts))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      loadBranches(projects),
      window.api.getAgents(),
      window.api.getAgentAccounts(),
    ]).then(([branches, agents, accounts]) => {
      if (cancelled) return;
      setData({ branches, agents, accounts });
      void Promise.all(
        agents.map(
          async (agent) => [agent.id, await window.api.getAgentVersion(agent.id)] as const,
        ),
      ).then((entries) => !cancelled && setVersions(Object.fromEntries(entries)));
    });
    return () => {
      cancelled = true;
    };
  }, [projects]);

  if (!data) return null;

  const start = async (draft: NewTaskDraft): Promise<boolean> => {
    const project = projects.find((item) => item.id === draft.project);
    if (!project) return false;
    const prefix = project.branchPrefix.replace(/\/+$/, "");
    const taken = new Set([
      ...sessions.filter((session) => session.projectId === project.id).map((s) => s.name),
      ...(data.branches[project.id] ?? [])
        .filter((branch) => !prefix || branch.startsWith(`${prefix}/`))
        .map((branch) => (prefix ? branch.slice(prefix.length + 1) : branch)),
    ]);
    const name = uniqueSlug(taskSlug(draft.title), taken);
    const agent = data.agents.find((item) => agentKind(item.slug) === draft.agent.agent);

    setStarting(true);
    try {
      const prompt = draft.resume
        ? draft.description.trim()
        : draft.description.trim() || draft.title.trim();
      const withAttachments = Boolean(agent) && draft.attachments.length > 0;
      const session = await startTask({
        projectId: project.id,
        name,
        title: draft.title.trim(),
        agentId: agent?.id,
        accountId: agent ? draft.agent.account : undefined,
        baseBranch: data.branches[project.id]?.length ? draft.base : undefined,
        prompt: withAttachments ? undefined : prompt,
        agentSettings: agent
          ? { model: draft.model, effort: draft.effort, mode: draft.mode }
          : undefined,
        environment: draft.environment,
        resumeClaudeSession: draft.resume ?? undefined,
      });
      if (withAttachments) {
        await window.api.agentSend(session.id, await agentMessage(prompt, draft.attachments));
      }
      setAddAgentHint(false);
      setStarting(false);
      onStarted?.();
      notifyCompact({ tone: "green", title: `Started on ${withBranchPrefix(name, prefix)}` });
      return true;
    } catch (error) {
      setStarting(false);
      const message = ipcErrorMessage(error);
      notify({
        tone: "red",
        status: "Failed",
        meta: project.name,
        title: "Couldn’t create the task",
        code: message,
        actions: [
          { label: "Try again", kind: "neutral", onClick: () => void start(draft) },
          {
            label: "Copy error",
            kind: "ghost",
            onClick: () => void navigator.clipboard.writeText(message),
          },
        ],
      });
      return false;
    }
  };

  return {
    projects: toDialogProjects(projects, workspaces, data.branches, environmentsOn),
    agents: agentOptions(data.agents, data.accounts, versions, usage),
    models,
    defaults: {
      model: prefs.model,
      effort: prefs.effort as Effort,
      mode: prefs.permissions as PermissionMode,
    },
    starting,
    start,
  };
}
