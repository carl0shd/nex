import type { ComponentType, ReactNode } from "react";
import { Apple, BoxIso, Cpu, Database, Globe, OpenNewWindow, WarningCircle } from "iconoir-react";
import { Button } from "@/components/atoms/button";
import { DitherProgress } from "@/components/atoms/dither-progress";
import { StatusDot } from "@/components/atoms/status-dot";
import { CheckList, type CheckItem } from "@/components/onboarding/check-list";
import { OnboardingStep, type StepAction } from "@/components/onboarding/onboarding-step";
import { SelectMenu } from "@/components/primitives/select-menu";
import { cn } from "@/lib/utils";

type RowIcon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

export interface EnvService {
  name: string;
  detail: string;
  address?: string;
}

export type EnvPhase = "offer" | "running" | "ready" | "unsupported" | "failed";

export interface EnvSetup {
  phase: EnvPhase;
  current: number;
  macos: string;
  took?: string;
  leftLabel?: string;
}

export interface EnvTask {
  branch: string;
  address: string;
  startedIn: string;
}

const MEMORY = ["4", "8", "12", "16"].map((value) => ({ value, label: `${value} GB` }));

function setupSteps(
  project: string,
  memory: string,
): {
  pending: string;
  done: string;
  doneDetail?: string;
  runningDetail?: string;
}[] {
  return [
    { pending: "Install Apple container", done: "Apple container 1.5 installed" },
    { pending: "Start the Linux machine", done: `Linux machine started · ${memory} GB` },
    {
      pending: "Registering .nex addresses",
      done: ".nex addresses registered",
      runningDetail: "Confirm with your password in the macOS dialog.",
    },
    { pending: "Trusting the HTTPS certificate", done: "HTTPS certificate trusted" },
    {
      pending: `Preparing the clean base for ${project}`,
      done: `Clean base for ${project} ready`,
      runningDetail: "Installs dependencies and runs migrations once.",
      doneDetail: "yarn install · 14 migrations · 1.4 GB",
    },
  ];
}

function setupItems(project: string, memory: string, setup: EnvSetup): CheckItem[] {
  return setupSteps(project, memory).map((step, index) => {
    if (index < setup.current) return { label: step.done, detail: step.doneDetail, state: "done" };
    if (index === setup.current && setup.phase === "failed")
      return { label: step.pending, detail: "The password dialog was closed.", state: "failed" };
    if (index === setup.current && setup.phase === "running")
      return { label: step.pending, detail: step.runningDetail, state: "running" };
    return {
      label: step.pending,
      detail: index === 4 ? step.runningDetail : undefined,
      state: "pending",
    };
  });
}

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
  onEdit,
}: {
  project: string;
  services: readonly EnvService[];
  onEdit?: () => void;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3 border-b border-line px-3.5 py-3">
        <IconTile icon={BoxIso} tone="green" />
        <span className="flex flex-1 flex-col">
          <span className="text-sm font-medium text-ink">Found in {project}</span>
          <span className="font-mono text-2xs text-ink-4">docker-compose.yml · package.json</span>
        </span>
        <Button variant="quiet" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <div className="flex flex-col py-1">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex h-[34px] items-center gap-3 px-3.5 font-mono text-2xs"
          >
            {service.address ? (
              <Globe width={13} height={13} strokeWidth={2} className="text-ink-4" />
            ) : (
              <Database width={13} height={13} strokeWidth={2} className="text-ink-4" />
            )}
            <span className="w-[60px] text-xs text-ink">{service.name}</span>
            <span className="flex-1 truncate text-ink-4">{service.detail}</span>
            <span className={service.address ? "text-ink-2" : "font-sans text-ink-4"}>
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

function SetupProgress({
  items,
  current,
  phase,
  took,
  leftLabel,
}: {
  items: CheckItem[];
  current: number;
  phase: EnvPhase;
  took?: string;
  leftLabel?: string;
}) {
  const total = items.length;
  const done = phase === "ready" ? total : current;
  return (
    <Card className="px-4 py-3.5">
      <DitherProgress value={(done / total) * 100} />
      <div className="mt-2 flex text-2xs text-ink-4">
        <span>
          {phase === "ready"
            ? `${total} of ${total}`
            : phase === "failed"
              ? `Stopped at step ${current + 1} of ${total}`
              : `Step ${current + 1} of ${total}`}
        </span>
        <span className="ml-auto">
          {phase === "ready" && took && `Took ${took}`}
          {phase === "running" && leftLabel}
        </span>
      </div>
      <CheckList items={items} className="mt-2" />
    </Card>
  );
}

function EnvPreview({
  project,
  tasks,
  services,
  memory,
  live,
}: {
  project: string;
  tasks: readonly EnvTask[];
  services: readonly EnvService[];
  memory: string;
  live: boolean;
}) {
  return (
    <figure className="m-0 flex flex-col gap-5 rounded-sheet bg-surface p-7 shadow-[0_0_0_1px_var(--line),0_24px_48px_-20px_rgb(0_0_0/60%)]">
      <div className="flex items-center gap-3">
        <IconTile icon={BoxIso} />
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-ink">
            {project} <span className="font-normal text-ink-3">· {tasks.length} tasks at once</span>
          </span>
          <span className="font-mono text-2xs text-ink-4">
            {live ? `one Linux machine · ${memory} GB` : "starts when setup finishes"}
          </span>
        </span>
      </div>
      <div className="ml-3.5 flex flex-col gap-2.5 border-l border-line-strong pl-6">
        {tasks.map((task) => (
          <div
            key={task.branch}
            className="flex flex-col gap-2.5 rounded-field bg-inset px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--line)]"
          >
            <div className="flex items-center gap-2.5">
              <StatusDot tone={live ? "green" : "idle"} />
              <span className="font-mono text-xs font-medium text-ink">{task.branch}</span>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-3xs text-ink-3">
                <Globe width={11} height={11} strokeWidth={2} />
                {task.address}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {services.map((service) => (
                <span
                  key={service.name}
                  className="flex h-[22px] items-center gap-1.5 rounded-full px-2 font-mono text-3xs text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)]"
                >
                  <StatusDot tone={live ? "green" : "idle"} size={5} />
                  {service.name}
                </span>
              ))}
              <span className="ml-auto text-2xs text-ink-4">
                {live ? `own database · ${task.startedIn}` : "waiting for setup"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <figcaption className="text-xs leading-[18px] text-ink-3">
        Each task gets its own localhost and its own copy of the database, cloned from a clean base
        in seconds. Open any of them in your browser by its address.
      </figcaption>
    </figure>
  );
}

export function EnvironmentsStep({
  project,
  services,
  tasks,
  memory,
  onMemoryChange,
  setup,
  onBack,
  onSetUp,
  onSkip,
  onContinue,
  onRetry,
  onShowLog,
}: {
  project: string;
  services: readonly EnvService[];
  tasks: readonly EnvTask[];
  memory: string;
  onMemoryChange: (memory: string) => void;
  setup: EnvSetup;
  onBack?: () => void;
  onSetUp?: () => void;
  onSkip?: () => void;
  onContinue?: () => void;
  onRetry?: () => void;
  onShowLog?: () => void;
}) {
  const items = setupItems(project, memory, setup);
  const continueAction: StepAction = { label: "Continue", onClick: onContinue };

  const copy: Record<EnvPhase, { title: string; description: string }> = {
    offer: {
      title: "Give each task its own environment",
      description: `Frontend, backend and database run per task, so several tasks work at once without fighting over ports or data. Nothing changes in ${project}.`,
    },
    running: {
      title: "Setting up environments",
      description:
        "About 2 minutes. You can go on: your first task starts its environment as soon as this is done.",
    },
    ready: {
      title: "Environments are ready",
      description: `Every new task in ${project} gets its own environment, started from the clean base.`,
    },
    unsupported: {
      title: "Environments need macOS 26",
      description: `This Mac runs macOS ${setup.macos}. Apple container only works on macOS 26 and later.`,
    },
    failed: {
      title: "Couldn’t register .nex addresses",
      description: "Environments run, but until this step is done you can only open them from Nex.",
    },
  };

  const actions: Record<EnvPhase, { primary: StepAction; secondary?: StepAction; note?: string }> =
    {
      offer: {
        primary: { label: "Set up", onClick: onSetUp },
        secondary: { label: "Not now", onClick: onSkip },
        note: "Remove anytime in Settings",
      },
      running: { primary: continueAction, secondary: { label: "Show log", onClick: onShowLog } },
      ready: { primary: continueAction },
      unsupported: { primary: continueAction },
      failed: {
        primary: { label: "Try again", onClick: onRetry },
        secondary: { label: "Skip this step", onClick: onSkip },
      },
    };

  const showPreview =
    setup.phase === "offer" || setup.phase === "running" || setup.phase === "ready";

  return (
    <OnboardingStep
      step={5}
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
            live={setup.phase !== "running"}
          />
        )
      }
    >
      {setup.phase === "offer" && (
        <>
          <FoundServices project={project} services={services} />
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-ink-3">Installs once on this Mac</span>
            <Card className="[&>*+*]:border-t [&>*+*]:border-line">
              <InstallRow
                icon={Apple}
                title="Apple container"
                detail="Linux runtime made by Apple · about 180 MB"
              />
              <InstallRow
                icon={Cpu}
                title="Linux machine"
                detail="Shared by every task"
                trailing={
                  <SelectMenu
                    value={memory}
                    options={MEMORY}
                    onChange={onMemoryChange}
                    className="w-[90px] min-w-0"
                  />
                }
              />
              <InstallRow
                icon={Globe}
                title=".nex addresses and HTTPS"
                detail="Asks for your password once"
                trailing={<span className="text-2xs text-ink-4">Your password</span>}
              />
            </Card>
          </div>
        </>
      )}

      {(setup.phase === "running" || setup.phase === "ready" || setup.phase === "failed") && (
        <SetupProgress
          items={items}
          current={setup.current}
          phase={setup.phase}
          took={setup.took}
          leftLabel={setup.leftLabel}
        />
      )}

      {setup.phase === "ready" && (
        <div className="flex items-center gap-3 rounded-panel bg-surface px-3.5 py-2.5 shadow-card">
          <Globe width={14} height={14} strokeWidth={2} className="text-ink-3" />
          <span className="flex flex-1 flex-col">
            <span className="text-sm font-medium text-ink">Try it</span>
            <span className="text-xs text-ink-3">A test page served from the machine</span>
          </span>
          <Button size="sm" className="font-mono text-2xs">
            https://hello.nex
            <OpenNewWindow width={11} height={11} strokeWidth={2} />
          </Button>
        </div>
      )}

      {setup.phase === "unsupported" && (
        <div className="flex items-start gap-3 rounded-panel bg-surface px-4 py-3.5 shadow-card">
          <IconTile icon={WarningCircle} tone="orange" />
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
