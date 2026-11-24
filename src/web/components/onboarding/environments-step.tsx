import type { ComponentType, ReactNode } from "react";
import { CircleAlert, Database, Globe, MemoryStick, Package } from "lucide-react";
import { AppleMark } from "@/components/atoms/brand-icons";
import { Button } from "@/components/atoms/button";
import { Orbit } from "@/components/atoms/orbit";
import { StatusDot } from "@/components/atoms/status-dot";
import { SetupProgress } from "@/components/environment/setup-progress";
import type { CheckItem } from "@/components/onboarding/check-list";
import { OnboardingStep, type StepAction } from "@/components/onboarding/onboarding-step";
import { SelectMenu, type SelectOption } from "@/components/primitives/select-menu";
import type { EnvCopy, EnvPhase } from "@/lib/environments";
import { cn } from "@/lib/utils";

type RowIcon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

export interface EnvService {
  name: string;
  detail: string;
  code?: boolean;
  meta?: string;
  address?: string;
}

export interface EnvSetup {
  phase: EnvPhase;
  steps: readonly CheckItem[];
  current: number;
  took?: string;
  leftLabel?: string;
  failure?: EnvCopy;
  unsupported?: EnvCopy;
}

export interface EnvTask {
  branch: string;
  address: string;
  startedIn: string;
}

const MEMORY = ["4", "8", "12", "16"].map((value) => ({ value, label: `${value} GB` }));

const FALLBACK_FAILURE: EnvCopy = {
  title: "Setup stopped",
  description: "Try again, or open the log to see what went wrong.",
};

const FALLBACK_UNSUPPORTED: EnvCopy = {
  title: "Environments aren’t available on this Mac",
  description: "Apple container needs macOS 26 on Apple silicon.",
};

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-panel bg-surface shadow-card", className)}>
      {children}
    </div>
  );
}

function IconTile({
  icon: Icon,
  tone = "neutral",
}: {
  icon: RowIcon;
  tone?: "neutral" | "green" | "orange";
}) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-control",
        tone === "green" && "bg-green-tint text-green",
        tone === "orange" && "bg-orange-tint text-orange",
        tone === "neutral" && "bg-hover text-ink-2",
      )}
    >
      <Icon width={14} height={14} strokeWidth={2} />
    </span>
  );
}

function TaskAddress({ address }: { address: string }) {
  const [head, ...rest] = address.split("task");
  return rest.length ? (
    <>
      {head}
      <span className="text-green">task</span>
      {rest.join("task")}
    </>
  ) : (
    address
  );
}

function FoundServices({
  project,
  services,
  sources,
  onEdit,
}: {
  project: string;
  services: readonly EnvService[];
  sources: readonly string[];
  onEdit?: () => void;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3 border-b border-line px-3.5 py-3">
        <IconTile icon={Package} tone="green" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 text-sm font-medium text-ink">
            <span className="shrink-0">Found in&nbsp;</span>
            <span className="truncate" title={project}>
              {project}
            </span>
          </span>
          {sources.length > 0 && (
            <span className="truncate text-2xs text-ink-4" title={sources.join(" · ")}>
              {sources.join(" · ")}
            </span>
          )}
        </span>
        {onEdit && (
          <Button variant="quiet" size="sm" onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>
      <div className="flex flex-col py-1">
        {services.map((service) => (
          <div key={service.name} className="flex h-[34px] items-center gap-3 px-3.5 text-2xs">
            {service.address ? (
              <Globe width={13} height={13} strokeWidth={2} className="shrink-0 text-ink-4" />
            ) : (
              <Database width={13} height={13} strokeWidth={2} className="shrink-0 text-ink-4" />
            )}
            <span title={service.name} className="w-[72px] shrink-0 truncate text-xs text-ink">
              {service.name}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-ink-4">
              <span title={service.detail} className={cn("truncate", service.code && "font-mono")}>
                {service.detail}
              </span>
              {service.meta && <span className="shrink-0 tabular-nums">· {service.meta}</span>}
            </span>
            <span className={cn("shrink-0", service.address ? "text-ink-2" : "text-ink-4")}>
              {service.address ? <TaskAddress address={service.address} /> : "inside the task"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function InstallRow({
  icon,
  title,
  detail,
  trailing,
}: {
  icon: RowIcon;
  title: string;
  detail: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <IconTile icon={icon} />
      <span className="flex flex-1 flex-col">
        <span className="text-sm font-medium text-ink">{title}</span>
        <span className="text-xs text-ink-3">{detail}</span>
      </span>
      {trailing}
    </div>
  );
}

type PreviewState = "offer" | "running" | "ready";

const EXAMPLE_TASKS = [62, 46, 54];
const EXAMPLE_SERVICES = ["app", "database"];
const PREVIEW_SERVICES = 4;

const PREVIEW_LINE: Record<PreviewState, (memory: string) => string> = {
  offer: (memory) => `Up to ${memory} GB for environments`,
  running: () => "Setting up…",
  ready: () => "Ready",
};

function PreviewChip({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-[22px] max-w-[120px] items-center gap-1.5 rounded-full px-2 text-2xs text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)]">
      {children}
    </span>
  );
}

function PreviewTask({
  name,
  services,
  state,
}: {
  name: ReactNode;
  services: readonly string[];
  state: PreviewState;
}) {
  const tone = state === "ready" ? "green" : "idle";
  return (
    <div className="flex flex-col gap-2.5 rounded-field bg-inset px-3.5 py-3 shadow-hairline">
      <div className="flex items-center gap-2.5">
        <StatusDot tone={tone} />
        {name}
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-2xs text-ink-4">
          <Globe width={11} height={11} strokeWidth={2} />
          Own address
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {services.slice(0, PREVIEW_SERVICES).map((service) => (
            <PreviewChip key={service}>
              <StatusDot tone={tone} size={5} />
              <span className="truncate">{service}</span>
            </PreviewChip>
          ))}
          {services.length > PREVIEW_SERVICES && (
            <PreviewChip>+{services.length - PREVIEW_SERVICES}</PreviewChip>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-2xs text-ink-4">
          <Database width={11} height={11} strokeWidth={2} />
          Own database
        </span>
      </div>
    </div>
  );
}

function EnvPreview({
  project,
  tasks,
  services,
  memory,
  state,
}: {
  project: string;
  tasks: readonly EnvTask[];
  services: readonly EnvService[];
  memory: string;
  state: PreviewState;
}) {
  const serviceNames = services.length ? services.map((service) => service.name) : EXAMPLE_SERVICES;
  return (
    <figure className="m-0 flex flex-col gap-5 rounded-sheet bg-surface p-7 shadow-raised">
      <div className="flex items-center gap-3">
        <IconTile icon={Package} tone={state === "ready" ? "green" : "neutral"} />
        <span className="flex min-w-0 flex-col">
          <span className="flex min-w-0 text-sm font-semibold text-ink">
            <span className="truncate" title={project}>
              {project}
            </span>
            <span className="shrink-0 font-normal text-ink-3">&nbsp;· several tasks at once</span>
          </span>
          <span className="text-xs text-ink-4">{PREVIEW_LINE[state](memory)}</span>
        </span>
        {state === "running" && <Orbit className="ml-auto" />}
      </div>
      <div className="ml-3.5 flex flex-col gap-2.5 border-l border-line-strong pl-6">
        {tasks.length > 0
          ? tasks.map((task) => (
              <PreviewTask
                key={task.branch}
                state={state}
                services={serviceNames}
                name={
                  <span className="truncate text-xs font-medium text-ink" title={task.branch}>
                    {task.branch}
                  </span>
                }
              />
            ))
          : EXAMPLE_TASKS.map((width) => (
              <PreviewTask
                key={width}
                state={state}
                services={serviceNames}
                name={
                  <span
                    aria-hidden
                    className="h-2 rounded-full bg-hover-2"
                    style={{ width: `${width}%` }}
                  />
                }
              />
            ))}
      </div>
      <figcaption className="text-xs leading-[18px] text-ink-3">
        Each task runs its services in their own containers, with its own address and its own copy
        of the database.
      </figcaption>
    </figure>
  );
}

export function EnvironmentsStep({
  project,
  services = [],
  sources = [],
  onEditServices,
  tasks = [],
  memory,
  memoryOptions = MEMORY,
  runtimeDetail,
  onMemoryChange,
  setup,
  onBack,
  onSetUp,
  starting = false,
  onContinue,
  onRetry,
  onShowLog,
}: {
  project: string;
  services?: readonly EnvService[];
  sources?: readonly string[];
  onEditServices?: () => void;
  tasks?: readonly EnvTask[];
  memory: string;
  memoryOptions?: readonly SelectOption<string>[];
  runtimeDetail: string;
  onMemoryChange: (memory: string) => void;
  setup: EnvSetup;
  onBack?: () => void;
  onSetUp?: () => void;
  starting?: boolean;
  onContinue?: () => void;
  onRetry?: () => void;
  onShowLog?: () => void;
}) {
  const continueAction: StepAction = { label: "Continue", onClick: onContinue };

  const copy: Record<EnvPhase, EnvCopy> = {
    offer: {
      title: "Give each task its own environment",
      description: `Frontend, backend and database run per task, so several tasks work at once without fighting over ports or data. Nothing changes in ${project}.`,
    },
    running: {
      title: "Setting up environments",
      description:
        "About 30 seconds, plus the Apple container download if this Mac doesn’t have it yet. Tasks need it, so this finishes first.",
    },
    ready: {
      title: "Environments are ready",
      description: `Apple container is running and .nex addresses work. New tasks in ${project} get their own environment.`,
    },
    unsupported: setup.unsupported ?? FALLBACK_UNSUPPORTED,
    failed: setup.failure ?? FALLBACK_FAILURE,
  };

  const actions: Record<EnvPhase, { primary: StepAction; secondary?: StepAction; note?: string }> =
    {
      offer: {
        primary: { label: "Set up", onClick: onSetUp, disabled: starting },
        note: "Every task needs it",
      },
      running: {
        primary: { ...continueAction, disabled: true },
        secondary: { label: "Show log", onClick: onShowLog },
      },
      ready: { primary: continueAction },
      unsupported: { primary: continueAction },
      failed: {
        primary: { label: "Try again", onClick: onRetry, disabled: starting },
        secondary: { label: "Show log", onClick: onShowLog },
      },
    };

  const showPreview =
    setup.phase === "offer" || setup.phase === "running" || setup.phase === "ready";
  const progressPhase =
    setup.phase === "running" || setup.phase === "ready" || setup.phase === "failed"
      ? setup.phase
      : null;

  return (
    <OnboardingStep
      step={4}
      title={copy[setup.phase].title}
      description={copy[setup.phase].description}
      onBack={onBack}
      {...actions[setup.phase]}
      aside={
        showPreview && (
          <EnvPreview
            project={project}
            tasks={tasks}
            services={services}
            memory={memory}
            state={setup.phase === "offer" || setup.phase === "running" ? setup.phase : "ready"}
          />
        )
      }
    >
      {setup.phase === "offer" && (
        <>
          {services.length > 0 && (
            <FoundServices
              project={project}
              services={services}
              sources={sources}
              onEdit={onEditServices}
            />
          )}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-ink-3">Installs once on this Mac</span>
            <Card className="[&>*+*]:border-t [&>*+*]:border-line">
              <InstallRow icon={AppleMark} title="Apple container" detail={runtimeDetail} />
              <InstallRow
                icon={Globe}
                title=".nex addresses"
                detail="Asks for your password once"
              />
              <InstallRow
                icon={MemoryStick}
                title="Memory for environments"
                detail="Shared by every task"
                trailing={
                  <SelectMenu
                    value={memory}
                    options={memoryOptions}
                    onChange={onMemoryChange}
                    className="w-[90px] min-w-0"
                  />
                }
              />
            </Card>
          </div>
        </>
      )}

      {progressPhase && setup.steps.length > 0 && (
        <SetupProgress
          items={setup.steps}
          current={setup.current}
          phase={progressPhase}
          took={setup.took}
          leftLabel={setup.leftLabel}
        />
      )}

      {setup.phase === "unsupported" && (
        <div className="flex items-start gap-3 rounded-panel bg-surface px-4 py-3.5 shadow-card">
          <IconTile icon={CircleAlert} tone="orange" />
          <span className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink">Tasks still work as today</span>
            <span className="text-xs leading-[18px] text-ink-3">
              Each one has its own worktree, but they share your localhost and database. Turn
              environments on from Settings after updating.
            </span>
          </span>
        </div>
      )}
    </OnboardingStep>
  );
}
