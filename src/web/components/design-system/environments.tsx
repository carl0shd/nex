import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/atoms/button";
import { Chip, CountChip } from "@/components/atoms/chip";
import { Composer } from "@/components/composer/composer";
import { WORKSPACES } from "@/components/design-system/sidebar-samples";
import { Section, Specimen } from "@/components/design-system/specimen";
import { AddressStatus } from "@/components/environment/address-status";
import { EnvBannerSlot, type EnvBannerState } from "@/components/environment/env-banner";
import { EnvTaskButton, type TaskService } from "@/components/environment/env-menu";
import { EnvStartStatus, type EnvStartState } from "@/components/environment/env-start-status";
import {
  EnvironmentsMeter,
  type EnvironmentsUsage,
} from "@/components/environment/machine-popover";
import { SettingsCard } from "@/components/primitives/setting-row";
import { Toast } from "@/components/primitives/toast";
import { Sidebar } from "@/components/sidebar/sidebar";
import type { SidebarWorkspace } from "@/components/sidebar/types";
import { CloseTaskDialog } from "@/components/task/close-task-dialog";
import type { EnvState } from "@/components/task/env-button";
import { TaskCard } from "@/components/task/task-card";
import { TaskEmptyState } from "@/components/task/task-empty-state";
import { TaskHeader, type TaskStatus } from "@/components/task/task-header";
import { TaskTabBar, type TaskView } from "@/components/task/task-tab-bar";

const MONOKU = { name: "Monoku", color: "#33843F" };

const SERVICES: TaskService[] = [
  {
    name: "web",
    detail: "fix-login.nex",
    url: "http://fix-login.nex",
    addresses: [
      { label: "fix-login.nex", url: "http://fix-login.nex" },
      { label: "localhost:5173", url: "http://localhost:5173" },
    ],
    state: "up",
  },
  {
    name: "api",
    detail: "api.fix-login.nex",
    url: "http://api.fix-login.nex",
    addresses: [
      { label: "api.fix-login.nex", url: "http://api.fix-login.nex" },
      { label: "localhost:8000", url: "http://localhost:8000" },
    ],
    state: "up",
  },
  { name: "postgres", detail: "localhost:5432 · while you view this task", state: "up" },
  { name: "redis", detail: ":6379 · inside the task", state: "up" },
];

const BLOCKED_SERVICES: TaskService[] = SERVICES.map((service) =>
  service.name === "api" ? { ...service, warning: "Port 8000 is used by another app" } : service,
);

const MENU_ACTIONS = { onCopyLink: () => {}, onCopyService: () => {}, onOpenWindow: () => {} };

function Skeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3 px-5 py-5">
      <span className="ml-auto h-7 w-[260px] rounded-field bg-hover" />
      <span className="h-2 w-[340px] rounded-full bg-hover" />
    </div>
  );
}

function EnvCard({
  env,
  status = "working",
  banner,
  services = SERVICES,
  menuOpen = false,
}: {
  env: EnvState;
  status?: TaskStatus;
  banner?: EnvBannerState;
  services?: readonly TaskService[];
  menuOpen?: boolean;
}) {
  const [view, setView] = useState<TaskView>("agent");
  return (
    <TaskCard state="rest" className="h-auto w-full overflow-visible">
      <TaskHeader
        title="Fix login redirect param"
        project="nex"
        branch="feat/fix-login-redirect"
        workspace={MONOKU}
        status={status}
      />
      <TaskTabBar
        view={view}
        onViewChange={setView}
        diff={{ added: 128, removed: 14 }}
        trailing={
          <>
            <EnvTaskButton
              state={env}
              label="fix-login.nex · 4 services"
              services={services.map((service) => ({
                ...service,
                state: env === "paused" ? "paused" : service.state,
              }))}
              actions={MENU_ACTIONS}
              defaultOpen={menuOpen}
            />
            <Chip>test</Chip>
            <CountChip count={3} />
          </>
        }
      />
      <EnvBannerSlot state={banner ?? null} />
      <Skeleton />
    </TaskCard>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <span className="text-xs text-ink-4">{label}</span>
      {children}
    </div>
  );
}

function EmptyTask({ state }: { state: EnvStartState }) {
  return (
    <TaskCard state="rest" className="h-[540px] w-full">
      <TaskEmptyState branch="feat/fix-login" base="main">
        <EnvStartStatus state={state} />
      </TaskEmptyState>
      <div className="px-2 pb-2">
        <Composer
          placeholder="Describe the task, @ a file, / for commands"
          defaultMode="auto"
          state="idle"
        />
      </div>
    </TaskCard>
  );
}

const ENV_WORKSPACES: SidebarWorkspace[] = WORKSPACES.slice(0, 1).map((workspace) => ({
  ...workspace,
  projects: workspace.projects.map((project) => ({
    ...project,
    tasks: project.tasks.map((task) =>
      task.id === "usage-panel"
        ? { ...task, env: "starting" as const }
        : task.id === "migrate-db-schema"
          ? { ...task, env: "down" as const }
          : task,
    ),
  })),
}));

const USAGE: EnvironmentsUsage = {
  usedGb: 5.1,
  totalGb: 8,
  containers: 9,
  idle: 1,
  environments: [
    {
      id: "a",
      title: "Fix login redirect param",
      project: "nex",
      detail: "4 services",
      state: "running",
      gb: 2.6,
    },
    {
      id: "b",
      title: "Usage panel charts",
      project: "nex",
      detail: "starting 2 of 4",
      state: "starting",
      gb: 0.6,
    },
    {
      id: "c",
      title: "Rename users to accounts",
      project: "api",
      detail: "api stopped",
      state: "down",
      gb: 1.4,
    },
    {
      id: "d",
      title: "Bump Electron to 39.2",
      project: "nex",
      detail: "",
      state: "paused",
      pausedFor: "1d",
    },
  ],
};

const FULL: EnvironmentsUsage = {
  ...USAGE,
  usedGb: 7.4,
  environments: [
    {
      id: "a",
      title: "Fix login redirect param",
      project: "nex",
      detail: "4 services",
      state: "running",
      gb: 2.6,
    },
    {
      id: "b",
      title: "Usage panel charts",
      project: "nex",
      detail: "idle 40 min",
      state: "running",
      gb: 1.1,
      suggested: true,
    },
    {
      id: "c",
      title: "Rename users to accounts",
      project: "api",
      detail: "3 services",
      state: "running",
      gb: 1.7,
    },
    {
      id: "d",
      title: "Bump Electron to 39.2",
      project: "nex",
      detail: "",
      state: "paused",
      pausedFor: "1d",
    },
  ],
};

function OverviewFrame({ usage, open }: { usage: EnvironmentsUsage; open: boolean }) {
  return (
    <div className="flex h-[720px] w-[600px] overflow-visible rounded-card bg-page shadow-card">
      <Sidebar
        workspaces={ENV_WORKSPACES}
        activeTaskId="none"
        needsYou={1}
        environments={<EnvironmentsMeter usage={usage} defaultOpen={open} />}
      />
    </div>
  );
}

const SIM_STEPS = [
  "postgres",
  "redis",
  "mailpit",
  "triton-django",
  "triton-hocuspocus",
  "triton-celeryworker",
  "oberon-web",
  "triton-django data",
];
const SIM_TICK_MS = 700;
const SIM_TICKS_PER_STEP = 3;
const SIM_READY_TICKS = 8;
const SIM_END = SIM_STEPS.length * SIM_TICKS_PER_STEP + SIM_READY_TICKS;

function simulatedStart(tick: number): { banner?: EnvBannerState; empty: EnvStartState } {
  const current = Math.floor(tick / SIM_TICKS_PER_STEP);
  const elapsed = `${Math.round((tick * SIM_TICK_MS) / 1000)}s`;
  if (current >= SIM_STEPS.length) {
    return {
      empty: {
        kind: "ready",
        addresses: [
          { label: "fix-login.nex", url: "http://fix-login.nex" },
          { label: "django.fix-login.nex", url: "http://django.fix-login.nex" },
        ],
        readyIn: elapsed,
      },
    };
  }
  const services = SIM_STEPS.map((name, index) => ({
    name,
    state:
      index < current
        ? ("done" as const)
        : index === current
          ? ("running" as const)
          : ("pending" as const),
  }));
  const filling = SIM_STEPS[current]?.endsWith(" data") ?? false;
  return {
    banner: { kind: "starting", elapsed, services },
    empty: { kind: filling ? "filling" : "starting", step: current, total: SIM_STEPS.length },
  };
}

function StartupSimulation() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((value) => (value + 1) % SIM_END), SIM_TICK_MS);
    return () => clearInterval(timer);
  }, []);
  const { banner, empty } = simulatedStart(tick);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => setTick(0)}>
          Replay
        </Button>
        <span className="text-xs text-ink-4 tabular-nums">
          {banner ? "Starting" : "Running"} · {Math.round((tick * SIM_TICK_MS) / 1000)}s
        </span>
      </div>
      <div className="grid w-full grid-cols-2 items-start gap-x-10">
        <EnvCard env={banner ? "starting" : "running"} banner={banner} />
        <EmptyTask state={empty} />
      </div>
    </div>
  );
}

export function Environments() {
  return (
    <Section
      id="environments"
      title="Environments on tasks"
      description="Each task's environment shows up in the globe of its tab bar, a strip under it when something needs you, the empty task while it starts, and the sidebar's memory meter."
    >
      <Specimen name="A full start, simulated · eight steps, then ready, then again" bare>
        <StartupSimulation />
      </Specimen>
      <Specimen name="Task card · press the globe for the environment menu" bare>
        <div className="grid w-full grid-cols-2 items-start gap-x-10 gap-y-8">
          <Labeled label="Running · the globe has a green dot">
            <EnvCard env="running" />
          </Labeled>
          <Labeled label="Environment menu">
            <EnvCard env="running" menuOpen />
          </Labeled>
          <Labeled label="Starting · the green texture moves as each service comes up">
            <EnvCard
              env="starting"
              banner={{
                kind: "starting",
                elapsed: "6s",
                services: [
                  { name: "postgres", state: "done" },
                  { name: "api", state: "running" },
                  { name: "web", state: "pending" },
                  { name: "api data", state: "pending" },
                ],
              }}
            />
          </Labeled>
          <Labeled label="Paused after being idle · resumes when you open the task">
            <EnvCard env="paused" status="idle" banner={{ kind: "paused", idleFor: "15 min" }} />
          </Labeled>
          <Labeled label="A service went down">
            <EnvCard
              env="down"
              banner={{
                kind: "down",
                service: "api",
                code: 1,
                error: "Error: connect ECONNREFUSED 127.0.0.1:6379",
              }}
            />
          </Labeled>
          <Labeled label="No memory to start · suggests pausing another task">
            <EnvCard
              env="waiting"
              banner={{
                kind: "waiting",
                reason: "memory",
                detail: "7.4 of 8 GB in use",
                suggestion: "Usage panel charts",
              }}
            />
          </Labeled>
          <Labeled label="No room · the most environments are already running">
            <EnvCard
              env="waiting"
              banner={{
                kind: "waiting",
                reason: "room",
                detail: "3 of 3 environments running",
                suggestion: "Usage panel charts",
              }}
            />
          </Labeled>
          <Labeled label="Paused from its menu">
            <EnvCard env="paused" status="idle" banner={{ kind: "paused" }} />
          </Labeled>
          <Labeled label="Didn’t start">
            <EnvCard
              env="down"
              banner={{ kind: "failed", error: "api didn’t build: npm ci exited with code 1" }}
            />
          </Labeled>
          <Labeled label="A port the project publishes is taken · Nex keeps trying">
            <EnvCard
              env="running"
              banner={{
                kind: "ports",
                title: "Port 8000 is used by another app",
                detail: "Nex takes it as soon as it’s free",
              }}
            />
          </Labeled>
          <Labeled label="Environment menu · a service whose port is taken">
            <EnvCard env="running" services={BLOCKED_SERVICES} menuOpen />
          </Labeled>
        </div>
      </Specimen>
      <Specimen name="A new task with an environment" bare>
        <div className="grid w-full grid-cols-2 gap-x-10 gap-y-8">
          <Labeled label="Just created · you can write while it starts">
            <EmptyTask state={{ kind: "starting", step: 2, total: 4 }} />
          </Labeled>
          <Labeled label="Ready · the task's addresses work in any browser">
            <EmptyTask
              state={{
                kind: "ready",
                addresses: [
                  { label: "fix-login.nex", url: "http://fix-login.nex" },
                  { label: "api.fix-login.nex", url: "http://api.fix-login.nex" },
                ],
                readyIn: "3.1s",
              }}
            />
          </Labeled>
          <Labeled label="No room · three environments already running">
            <EmptyTask
              state={{ kind: "waiting", running: 3, max: 3, suggestion: "Usage panel charts" }}
            />
          </Labeled>
          <Labeled label="Filling a new task’s databases · its own migrations and test data">
            <EmptyTask state={{ kind: "filling", step: 4, total: 5 }} />
          </Labeled>
          <Labeled label="Created without its environment · the tab bar globe starts it too">
            <EmptyTask state={{ kind: "off" }} />
          </Labeled>
        </div>
      </Specimen>
      <Specimen
        name="Sidebar · dots while a task starts, a red globe when a service is down, memory below"
        bare
      >
        <div className="flex flex-wrap items-start gap-10">
          <OverviewFrame usage={USAGE} open />
          <OverviewFrame usage={FULL} open />
        </div>
      </Specimen>
      <Specimen name="Errors and closing a task" bare>
        <div className="flex flex-wrap items-start gap-10">
          <div className="flex w-[440px] flex-col gap-4">
            <Toast
              tone="orange"
              status="Needs repair"
              title=".nex addresses stopped working"
              body="Something on this Mac reset them, often a VPN or a macOS update. Tasks keep running; open them from Nex meanwhile."
              actions={[
                { label: "Repair", kind: "neutral" },
                { label: "Not now", kind: "ghost" },
              ]}
            />
            <SettingsCard>
              <AddressStatus resolving={false} domain=".nex" />
            </SettingsCard>
          </div>
          <CloseTaskDialog
            task={{
              title: "Fix login redirect param",
              branch: "feat/fix-login-redirect",
              uncommitted: 3,
              environment: { size: "240 MB", address: "fix-login.nex" },
            }}
          />
        </div>
      </Specimen>
    </Section>
  );
}
