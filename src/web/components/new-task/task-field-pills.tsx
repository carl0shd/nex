import { Globe, Plus } from "lucide-react";
import { ModelMenu } from "@/components/composer/model-menu";
import { PermissionMenu } from "@/components/composer/permission-menu";
import { AgentPicker } from "@/components/new-task/agent-picker";
import { FieldAction, FieldPill, FieldToggle } from "@/components/new-task/field-pill";
import { BranchPicker, ProjectPicker } from "@/components/new-task/place-pickers";
import { ClaudeSessionPicker } from "@/components/new-task/claude-session-picker";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { TASK_PICKERS, type TaskFields, type TaskPicker } from "@/hooks/use-task-fields";
import { cn } from "@/lib/utils";

type PillProps = { fields: TaskFields; disabled?: boolean; onAddProject?: () => void };

function usePillPopovers({ fields, disabled = false }: PillProps) {
  const { open, setOpen, pills } = fields;
  return {
    popover: (picker: TaskPicker) => ({
      open: open === picker,
      onOpenChange: (next: boolean) => setOpen(next ? picker : null),
      side: "bottom" as const,
    }),
    trigger: (picker: TaskPicker) => (
      <FieldPill
        {...pills[picker]}
        disabled={disabled}
        open={open === picker}
        onClick={() => setOpen(open === picker ? null : picker)}
      />
    ),
    choose:
      <T,>(apply: (value: T) => void) =>
      (value: T) => {
        apply(value);
        setOpen(null);
      },
  };
}

function TaskPlacePills(props: PillProps) {
  const { fields, disabled = false, onAddProject } = props;
  const { popover, trigger, choose } = usePillPopovers(props);
  return (
    <>
      {fields.current ? (
        <>
          <AnchoredPopover
            {...popover("project")}
            className="shrink-0"
            trigger={trigger("project")}
          >
            <ProjectPicker
              projects={fields.projects}
              value={fields.project}
              onChange={choose(fields.setProject)}
            />
          </AnchoredPopover>
          <AnchoredPopover {...popover("base")} className="min-w-0" trigger={trigger("base")}>
            <BranchPicker
              branches={fields.current.branches}
              value={fields.base}
              onChange={choose(fields.setBase)}
            />
          </AnchoredPopover>
        </>
      ) : (
        onAddProject && (
          <FieldAction
            icon={<Plus width={12} height={12} strokeWidth={2.25} />}
            label="Add a project"
            disabled={disabled}
            onClick={onAddProject}
          />
        )
      )}
      <TaskEnvironmentToggle fields={fields} disabled={disabled} />
    </>
  );
}

function TaskAgentPills(props: PillProps) {
  const { fields } = props;
  const { popover, trigger, choose } = usePillPopovers(props);
  return (
    <>
      <AnchoredPopover {...popover("agent")} trigger={trigger("agent")}>
        <AgentPicker
          agents={fields.agents}
          value={fields.agent}
          onChange={choose(fields.setAgent)}
        />
      </AnchoredPopover>
      <AnchoredPopover {...popover("model")} trigger={trigger("model")}>
        <ModelMenu
          models={fields.models}
          model={fields.model}
          onModelChange={fields.setModel}
          effort={fields.effort}
          onEffortChange={fields.setEffort}
        />
      </AnchoredPopover>
      <AnchoredPopover {...popover("mode")} trigger={trigger("mode")}>
        <PermissionMenu mode={fields.mode} modes={fields.modes} onChange={fields.setMode} />
      </AnchoredPopover>
      {fields.sessions.length > 0 && (
        <AnchoredPopover
          {...popover("session")}
          className="enter-fade min-w-0"
          trigger={trigger("session")}
        >
          <ClaudeSessionPicker
            sessions={fields.sessions}
            value={fields.resume?.id ?? null}
            onChange={choose(fields.setResume)}
          />
        </AnchoredPopover>
      )}
    </>
  );
}

export function TaskFieldRows({
  action,
  className,
  ...props
}: PillProps & { action: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-end gap-2", className)}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-2">
        <TaskPlacePills {...props} />
        <TaskAgentPills {...props} />
      </div>
      <span className="shrink-0">{action}</span>
    </div>
  );
}

export function TaskFieldPills(props: PillProps) {
  return (
    <>
      <TaskPlacePills {...props} />
      <TaskAgentPills {...props} />
    </>
  );
}

export function TaskFieldPillsMeasure({ fields }: { fields: TaskFields }) {
  return (
    <>
      {TASK_PICKERS.map((picker) => (
        <FieldPill key={picker} {...fields.pills[picker]} animate={false} />
      ))}
      <TaskEnvironmentToggle fields={fields} />
      {fields.sessions.length > 0 && <FieldPill {...fields.pills.session} animate={false} />}
    </>
  );
}

function TaskEnvironmentToggle({
  fields,
  disabled = false,
}: {
  fields: TaskFields;
  disabled?: boolean;
}) {
  if (!fields.hasEnvironment) return null;
  return (
    <FieldToggle
      icon={<Globe width={12} height={12} strokeWidth={2} />}
      label="Environment"
      checked={fields.environment}
      disabled={disabled}
      onChange={fields.setEnvironment}
    />
  );
}
