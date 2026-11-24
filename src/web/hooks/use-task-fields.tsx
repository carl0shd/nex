import { useState } from "react";
import { GitBranch, MessageSquare, ShieldCheck } from "lucide-react";
import type { ClaudeSessionInfo } from "@native/agents/claude-sessions";
import { AgentLogo } from "@/components/atoms/agent-logo";
import { Monogram } from "@/components/atoms/entity-chip";
import type { Attachment } from "@/components/composer/attachments";
import type { Effort } from "@/components/composer/effort";
import type { ModelOption } from "@/components/composer/model-menu";
import { MODELS, resolveModel } from "@/components/composer/models";
import type { PermissionMode } from "@/components/composer/permission-menu";
import type { AgentChoice, AgentOption } from "@/components/new-task/agent-picker";
import type { FieldPillContent } from "@/components/new-task/field-pill";
import type { NewTaskProject } from "@/components/new-task/place-pickers";
import { PERMISSION_LABEL, PERMISSION_MODES } from "@/lib/permission-modes";
import { taskBranchName } from "@/lib/task-branch";
import { useClaudeSessions } from "@/hooks/use-claude-sessions";

export interface NewTaskDraft {
  title: string;
  description: string;
  project: string;
  base: string;
  branch: string;
  agent: AgentChoice;
  model: string;
  effort: Effort;
  mode: PermissionMode;
  environment: boolean;
  attachments: readonly Attachment[];
  resume: ClaudeSessionInfo | null;
}

export type TaskPicker = "project" | "base" | "agent" | "model" | "mode" | "session";

export const TASK_PICKERS: readonly TaskPicker[] = ["project", "base", "agent", "model", "mode"];

export interface TaskFieldOptions {
  projects: readonly NewTaskProject[];
  agents: readonly AgentOption[];
  models?: readonly ModelOption[];
  defaultProject?: string;
  defaults?: { model: string; effort: Effort; mode: PermissionMode };
}

export function useTaskFields({
  projects,
  agents,
  models = MODELS,
  defaultProject,
  defaults,
}: TaskFieldOptions) {
  const firstProject = projects.find((project) => project.id === defaultProject) ?? projects[0];
  const [project, setProjectId] = useState(firstProject?.id ?? "");
  const [base, setBase] = useState(firstProject?.branches[0] ?? "main");
  const [agent, setAgent] = useState<AgentChoice>({
    agent: agents[0]?.id ?? "claude",
    account: agents[0]?.accounts?.[0]?.id,
  });
  const [model, setModel] = useState(
    (defaults?.model ? resolveModel(models, defaults.model)?.id : undefined) ??
      models[1]?.id ??
      models[0]?.id ??
      "",
  );
  const [effort, setEffort] = useState<Effort>(defaults?.effort ?? "high");
  const [mode, setMode] = useState<PermissionMode>(defaults?.mode ?? "manual");
  const [environment, setEnvironment] = useState(true);
  const [open, setOpen] = useState<TaskPicker | null>(null);
  const [resume, setResume] = useState<ClaudeSessionInfo | null>(null);

  const current = projects.find((item) => item.id === project) ?? firstProject;
  const sessions = useClaudeSessions(current?.id);
  const currentAgent = agents.find((option) => option.id === agent.agent);
  const account = currentAgent?.accounts?.find((item) => item.id === agent.account);
  const agentName = currentAgent?.shortName ?? currentAgent?.name ?? "";
  const modes =
    models.find((option) => option.id === model)?.autoMode === false
      ? PERMISSION_MODES.filter((option) => option !== "auto")
      : PERMISSION_MODES;

  const pills: Record<TaskPicker, FieldPillContent> = {
    project: {
      icon: current && (
        <Monogram
          size="sm"
          color={current.workspace.color}
          image={current.workspace.image}
          icon={current.workspace.icon}
        >
          {current.workspace.name[0]}
        </Monogram>
      ),
      label: current?.name ?? "",
    },
    base: {
      shrink: true,
      icon: <GitBranch width={12} height={12} strokeWidth={2} />,
      label: base,
    },
    agent: {
      icon: <AgentLogo agent={agent.agent} size={16} />,
      label: account && (currentAgent?.accounts?.length ?? 0) > 1 ? account.name : agentName,
    },
    model: { label: models.find((option) => option.id === model)?.name ?? "" },
    mode: {
      icon: <ShieldCheck width={12} height={12} strokeWidth={2} />,
      label: PERMISSION_LABEL[mode],
    },
    session: {
      shrink: Boolean(resume),
      icon: <MessageSquare width={11} height={11} strokeWidth={2.25} className="ml-px" />,
      label: resume ? resume.title : "New chat",
    },
  };

  return {
    projects,
    agents,
    models,
    project,
    setProject: (id: string) => {
      setProjectId(id);
      setBase(projects.find((item) => item.id === id)?.branches[0] ?? "main");
      setResume(null);
    },
    sessions,
    resume,
    setResume,
    base,
    setBase,
    agent,
    setAgent,
    model,
    setModel,
    effort,
    setEffort,
    mode,
    setMode,
    modes,
    environment,
    setEnvironment,
    hasEnvironment: Boolean(current?.environment),
    current,
    pills,
    open,
    setOpen,
    branchFor: (title: string) => taskBranchName(title, current?.branchPrefix),
    draft: (
      title: string,
      description = "",
      attachments: readonly Attachment[] = [],
    ): NewTaskDraft => ({
      title,
      description,
      project: current?.id ?? project,
      base,
      branch: taskBranchName(title, current?.branchPrefix),
      agent,
      model,
      effort,
      mode,
      environment: !current?.environment || environment,
      attachments,
      resume,
    }),
  };
}

export type TaskFields = ReturnType<typeof useTaskFields>;
