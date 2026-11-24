import { useHotkey } from "@tanstack/react-hotkeys";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Kbd } from "@/components/atoms/kbd";
import type { ModelOption } from "@/components/composer/model-menu";
import type { AgentOption } from "@/components/new-task/agent-picker";
import { DetailsEditor } from "@/components/new-task/details-editor";
import type { NewTaskProject } from "@/components/new-task/place-pickers";
import { StartTaskButton } from "@/components/new-task/start-task-button";
import { TaskFieldPills, TaskFieldPillsMeasure } from "@/components/new-task/task-field-pills";
import { Overlay } from "@/components/primitives/overlay";
import {
  TASK_PICKERS,
  useTaskFields,
  type NewTaskDraft,
  type TaskFieldOptions,
} from "@/hooks/use-task-fields";
import { cn } from "@/lib/utils";
import { shortcutLabel } from "@/lib/app-shortcuts";

const DIALOG_PADDING_X = 40;
const LABEL_ROUNDING_PX = 1;
const ACTION_ROOM = 72;
const MIN_WIDTH = 820;
const MAX_WIDTH = 1040;

export function NewTaskDialog({
  projects,
  agents,
  models,
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
  defaults?: TaskFieldOptions["defaults"];
  starting?: boolean;
  onStart?: (draft: NewTaskDraft) => void;
  onClose?: () => void;
}) {
  const fields = useTaskFields({ projects, agents, models, defaultProject, defaults });
  const { open, base, current, pills } = fields;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  const branch = fields.branchFor(title);
  const taskTitle = title.trim() || fields.resume?.title || "";
  const canStart = taskTitle.length > 0 && Boolean(current) && !starting;

  const start = () => {
    if (canStart) onStart?.(fields.draft(taskTitle, description));
  };

  useHotkey("Escape", () => onClose?.(), { target: dialogRef, enabled: !open && !starting });
  useHotkey("Mod+Enter", start, { target: dialogRef });

  const pillsKey = [
    fields.project,
    fields.agent.agent,
    fields.hasEnvironment,
    ...TASK_PICKERS.map((picker) => pills[picker].label),
  ].join("|");

  // Each pill eases its own width over the same 200ms as the dialog, so the row fits every frame.
  useLayoutEffect(() => {
    const row = measureRef.current;
    if (!row) return;
    const rounding = (TASK_PICKERS.length + 1) * LABEL_ROUNDING_PX;
    setWidth(
      Math.min(
        Math.max(row.offsetWidth + rounding + ACTION_ROOM + DIALOG_PADDING_X, MIN_WIDTH),
        MAX_WIDTH,
      ),
    );
  }, [pillsKey]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatesWidth(true));
    return () => cancelAnimationFrame(frame);
  }, []);

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
          "enter-pop relative h-fit w-[820px] max-w-[calc(100vw-64px)] rounded-sheet bg-surface-raised px-5 pt-[18px] pb-3.5 shadow-modal",
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
          <TaskFieldPillsMeasure fields={fields} />
          <StartTaskButton ready={false} />
        </div>
        <div className="mt-3.5 flex min-w-0 items-center gap-1.5 border-t border-line pt-3">
          <TaskFieldPills fields={fields} disabled={starting} />
          <StartTaskButton
            ready={canStart}
            starting={starting}
            onClick={start}
            className="ml-auto"
          />
        </div>
      </div>
    </Overlay>
  );
}
