import { useHotkey } from "@tanstack/react-hotkeys";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GitBranch, ShieldCheck } from "lucide-react";
import { AgentLogo } from "@/components/atoms/agent-logo";
import { Button } from "@/components/atoms/button";
import { Monogram } from "@/components/atoms/entity-chip";
import { Kbd } from "@/components/atoms/kbd";
import type { Effort } from "@/components/composer/effort";
import { ModelMenu, type ModelOption } from "@/components/composer/model-menu";
import { MODELS, resolveModel } from "@/components/composer/models";
import { PermissionMenu, type PermissionMode } from "@/components/composer/permission-menu";
import { PERMISSION_LABEL, PERMISSION_MODES } from "@/lib/permission-modes";
import {
  AgentPicker,
  type AgentChoice,
  type AgentOption,
} from "@/components/new-task/agent-picker";
import { DetailsEditor } from "@/components/new-task/details-editor";
import { FieldPill, type FieldPillContent } from "@/components/new-task/field-pill";
import {
  BranchPicker,
  ProjectPicker,
  type NewTaskProject,
} from "@/components/new-task/place-pickers";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Overlay } from "@/components/primitives/overlay";
import { cn } from "@/lib/utils";
import { taskBranchName } from "@/lib/task-branch";
import { shortcutLabel } from "@/lib/app-shortcuts";

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

const PICKERS: readonly Picker[] = ["project", "base", "agent", "model", "mode"];
const DIALOG_PADDING_X = 40;
const MIN_WIDTH = 700;
const MAX_WIDTH = 780;

export function NewTaskDialog({
  projects,
  agents,
  models = MODELS,
  defaultProject,
  defaults,
  starting = false,
  onStart,
  onClose,
}: {
  projects: readonly NewTaskProject[];
  agents: readonly AgentOption[];
  models?: readonly ModelOption[];
  defaultProject?: string;
  defaults?: { model: string; effort: Effort; mode: PermissionMode };
  starting?: boolean;
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
  const [model, setModel] = useState(
    (defaults?.model ? resolveModel(models, defaults.model)?.id : undefined) ??
      models[1]?.id ??
      models[0]?.id ??
      "",
  );
  const [effort, setEffort] = useState<Effort>(defaults?.effort ?? "high");
  const [mode, setMode] = useState<PermissionMode>(defaults?.mode ?? "manual");
  const [open, setOpen] = useState<Picker | null>(null);
  const modes =
    models.find((option) => option.id === model)?.autoMode === false
      ? PERMISSION_MODES.filter((option) => option !== "auto")
      : PERMISSION_MODES;
  const dialogRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();
  const [animatesWidth, setAnimatesWidth] = useState(false);
  const pickerOpenAtPress = useRef(false);

  // A picker closes on pointerdown, before the scrim's click lands, so remember it was open.
  useEffect(() => {
    const onPointerDown = () => {
      pickerOpenAtPress.current = open !== null;
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  const current = projects.find((item) => item.id === project) ?? firstProject;
  const currentAgent = agents.find((option) => option.id === agent.agent);
  const account = currentAgent?.accounts?.find((item) => item.id === agent.account);
  const agentName = currentAgent?.shortName ?? currentAgent?.name ?? "";
  const branch = taskBranchName(title, current?.branchPrefix);
  const canStart = title.trim().length > 0 && Boolean(current) && !starting;

  const start = () => {
    if (!canStart) return;
    onStart?.({ title, description, project, base, branch, agent, model, effort, mode });
  };

  useHotkey("Escape", () => onClose?.(), { target: dialogRef, enabled: !open && !starting });
  useHotkey("Mod+Enter", start, { target: dialogRef });

  const pills: Record<Picker, FieldPillContent> = {
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
  };
  const startLabel = starting ? "Starting…" : "Start task";
  const pillsKey = [project, agent.agent, ...PICKERS.map((picker) => pills[picker].label)].join(
    "|",
  );

  // Each pill eases its own width over the same 200ms as the dialog, so the row fits every frame.
  useLayoutEffect(() => {
    const row = measureRef.current;
    if (!row) return;
    setWidth(Math.min(Math.max(row.offsetWidth + 1 + DIALOG_PADDING_X, MIN_WIDTH), MAX_WIDTH));
  }, [pillsKey]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatesWidth(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const popover = (picker: Picker) => ({
    open: open === picker,
    onOpenChange: (next: boolean) => setOpen(next ? picker : null),
    side: "bottom" as const,
  });
  const toggle = (picker: Picker) => () => setOpen((value) => (value === picker ? null : picker));

  return (
    <Overlay
      offset={198}
      onClose={() => {
        if (!pickerOpenAtPress.current && !starting) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-label="New task"
        ref={dialogRef}
        className={cn(
          "enter-pop relative h-fit w-[700px] max-w-[calc(100vw-64px)] rounded-sheet bg-surface-raised px-5 pt-[18px] pb-3.5 shadow-modal",
          animatesWidth && "transition-[width] duration-200 ease-out-strong",
        )}
        style={{ width, transformOrigin: "top center" }}
      >
        <div className="flex items-center gap-2 text-xs text-ink-4">
          <span className="text-sm font-semibold text-ink">New task</span>
          <Kbd>{shortcutLabel("new-task")}</Kbd>
          <span className="ml-auto flex min-w-0 items-center gap-1">
            <span title={branch} className="truncate text-2xs text-ink-3">
              {branch}
            </span>
            <span className="shrink-0">from</span>
            <span title={base} className="max-w-[160px] truncate text-2xs text-ink-3">
              {base}
            </span>
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <input
            autoFocus
            aria-label="Task title"
            value={title}
            disabled={starting}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What should Claude do?"
            className="bg-transparent text-xl leading-7 font-semibold tracking-[-0.02em] text-ink outline-none placeholder:text-ink-5"
          />
          <DetailsEditor
            disabled={starting}
            placeholder="Add details, paste a link or an error…"
            onChange={setDescription}
          />
        </div>
        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none invisible absolute top-0 left-0 flex w-max items-center gap-1.5"
        >
          {PICKERS.map((picker) => (
            <FieldPill key={picker} {...pills[picker]} animate={false} />
          ))}
          <Button variant="primary" size="sm" kbd="⌘↵" className="h-8 text-sm">
            {startLabel}
          </Button>
        </div>
        <div className="mt-3.5 flex min-w-0 items-center gap-1.5 border-t border-line pt-3">
          <AnchoredPopover
            {...popover("project")}
            className="min-w-0"
            trigger={
              <FieldPill
                {...pills.project}
                disabled={starting}
                open={open === "project"}
                onClick={toggle("project")}
              />
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
            className="min-w-0"
            trigger={
              <FieldPill
                {...pills.base}
                disabled={starting}
                open={open === "base"}
                onClick={toggle("base")}
              />
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
              <FieldPill
                {...pills.agent}
                disabled={starting}
                open={open === "agent"}
                onClick={toggle("agent")}
              />
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
              <FieldPill
                {...pills.model}
                disabled={starting}
                open={open === "model"}
                onClick={toggle("model")}
              />
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
              <FieldPill
                {...pills.mode}
                disabled={starting}
                open={open === "mode"}
                onClick={toggle("mode")}
              />
            }
          >
            <PermissionMenu mode={mode} modes={modes} onChange={setMode} />
          </AnchoredPopover>
          <Button
            variant="primary"
            size="sm"
            kbd="⌘↵"
            disabled={!canStart}
            onClick={start}
            className="ml-auto h-8 shrink-0 text-sm"
          >
            {startLabel}
          </Button>
        </div>
      </div>
    </Overlay>
  );
}
