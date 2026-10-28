import { useEffect, useState, type KeyboardEvent } from "react";
import { GitBranch, ShieldCheck } from "iconoir-react";
import { AgentLogo } from "@/components/atoms/agent-logo";
import { Button } from "@/components/atoms/button";
import { Monogram } from "@/components/atoms/entity-chip";
import { Kbd } from "@/components/atoms/kbd";
import type { Effort } from "@/components/composer/effort";
import { ModelMenu, type ModelOption } from "@/components/composer/model-menu";
import { MODELS } from "@/components/composer/models";
import { PermissionMenu, type PermissionMode } from "@/components/composer/permission-menu";
import {
  AgentPicker,
  type AgentChoice,
  type AgentOption,
} from "@/components/new-task/agent-picker";
import { FieldPill } from "@/components/new-task/field-pill";
import {
  BranchPicker,
  ProjectPicker,
  type NewTaskProject,
} from "@/components/new-task/place-pickers";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Overlay } from "@/components/primitives/overlay";
import { taskBranchName } from "@/lib/task-branch";

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
}

type Picker = "project" | "base" | "agent" | "model" | "mode";

const MODE_LABEL: Record<PermissionMode, string> = {
  plan: "Plan",
  manual: "Ask",
  dontask: "Don't ask",
  edits: "Accept edits",
  auto: "Auto",
  bypass: "Bypass",
};

export function NewTaskDialog({
  projects,
  agents,
  models = MODELS,
  defaultProject,
  onStart,
  onClose,
}: {
  projects: readonly NewTaskProject[];
  agents: readonly AgentOption[];
  models?: readonly ModelOption[];
  defaultProject?: string;
  onStart?: (draft: NewTaskDraft) => void;
  onClose?: () => void;
}) {
  const firstProject = projects.find((project) => project.id === defaultProject) ?? projects[0];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [project, setProject] = useState(firstProject?.id ?? "");
  const [base, setBase] = useState(firstProject?.branches[0] ?? "main");
  const [agent, setAgent] = useState<AgentChoice>({
    agent: agents[0]?.id ?? "claude",
    account: agents[0]?.accounts?.[0]?.id,
  });
  const [model, setModel] = useState(models[1]?.id ?? models[0]?.id ?? "");
  const [effort, setEffort] = useState<Effort>("high");
  const [mode, setMode] = useState<PermissionMode>("manual");
  const [open, setOpen] = useState<Picker | null>(null);

  const current = projects.find((item) => item.id === project) ?? firstProject;
  const currentAgent = agents.find((option) => option.id === agent.agent);
  const account = currentAgent?.accounts?.find((item) => item.id === agent.account);
  const branch = taskBranchName(title);
  const canStart = title.trim().length > 0;

  const start = () => {
    if (!canStart) return;
    onStart?.({ title, description, project, base, branch, agent, model, effort, mode });
  };

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !open) onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const submitShortcut = (event: KeyboardEvent) => {
    if (event.key === "Enter" && event.metaKey) {
      event.preventDefault();
      start();
    }
  };

  const popover = (picker: Picker) => ({
    open: open === picker,
    onOpenChange: (next: boolean) => setOpen(next ? picker : null),
    side: "bottom" as const,
  });
  const toggle = (picker: Picker) => () => setOpen((value) => (value === picker ? null : picker));

  return (
    <Overlay offset={150} onClose={onClose}>
      <div
        role="dialog"
        aria-label="New task"
        onKeyDown={submitShortcut}
        className="enter-pop relative h-fit w-[700px] rounded-sheet bg-surface-raised px-5 pt-[18px] pb-3.5 shadow-modal"
        style={{ transformOrigin: "top center" }}
      >
        <div className="flex items-center gap-2 text-xs text-ink-4">
          <span className="text-sm font-semibold text-ink">New task</span>
          <Kbd>⌘T</Kbd>
          <span className="ml-auto">
            <span className="font-mono text-2xs text-ink-3">{branch}</span> from{" "}
            <span className="font-mono text-2xs text-ink-3">{base}</span>
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <input
            autoFocus
            aria-label="Task title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What should Claude do?"
            className="bg-transparent text-xl leading-7 font-semibold tracking-[-0.02em] text-ink outline-none placeholder:text-ink-5"
          />
          <textarea
            aria-label="Details"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add details, paste a link or an error…"
            rows={3}
            className="min-h-[66px] resize-none bg-transparent text-base text-ink-3 outline-none placeholder:text-ink-5"
          />
        </div>
        <div className="mt-3.5 flex items-center gap-1.5 border-t border-line pt-3">
          <AnchoredPopover
            {...popover("project")}
            trigger={
              <FieldPill open={open === "project"} onClick={toggle("project")}>
                {current && (
                  <Monogram size="sm" color={current.workspace.color}>
                    {current.workspace.name[0]}
                  </Monogram>
                )}
                {current?.name}
              </FieldPill>
            }
          >
            <ProjectPicker
              projects={projects}
              value={project}
              onChange={(id) => {
                setProject(id);
                setBase(projects.find((item) => item.id === id)?.branches[0] ?? "main");
                setOpen(null);
              }}
            />
          </AnchoredPopover>
          <AnchoredPopover
            {...popover("base")}
            trigger={
              <FieldPill open={open === "base"} onClick={toggle("base")}>
                <GitBranch width={12} height={12} strokeWidth={2} />
                {base}
              </FieldPill>
            }
          >
            <BranchPicker
              branches={current?.branches ?? []}
              value={base}
              onChange={(next) => {
                setBase(next);
                setOpen(null);
              }}
            />
          </AnchoredPopover>
          <AnchoredPopover
            {...popover("agent")}
            trigger={
              <FieldPill open={open === "agent"} onClick={toggle("agent")}>
                <AgentLogo agent={agent.agent} size={16} />
                {currentAgent?.name}
                {account && ` · ${account.name}`}
              </FieldPill>
            }
          >
            <AgentPicker
              agents={agents}
              value={agent}
              onChange={(choice) => {
                setAgent(choice);
                setOpen(null);
              }}
            />
          </AnchoredPopover>
          <AnchoredPopover
            {...popover("model")}
            trigger={
              <FieldPill open={open === "model"} onClick={toggle("model")}>
                {models.find((option) => option.id === model)?.name}
              </FieldPill>
            }
          >
            <ModelMenu
              models={models}
              model={model}
              onModelChange={setModel}
              effort={effort}
              onEffortChange={setEffort}
            />
          </AnchoredPopover>
          <AnchoredPopover
            {...popover("mode")}
            trigger={
              <FieldPill open={open === "mode"} onClick={toggle("mode")}>
                <ShieldCheck width={12} height={12} strokeWidth={2} />
                {MODE_LABEL[mode]}
              </FieldPill>
            }
          >
            <PermissionMenu mode={mode} onChange={setMode} />
          </AnchoredPopover>
          <Button
            variant="primary"
            size="sm"
            kbd="⌘↵"
            disabled={!canStart}
            onClick={start}
            className="ml-auto h-8 text-sm"
          >
            Start task
          </Button>
        </div>
      </div>
    </Overlay>
  );
}
