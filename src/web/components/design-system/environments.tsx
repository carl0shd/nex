import { useState, type ReactNode } from "react";
import { Chip, CountChip } from "@/components/atoms/chip";
import { Composer } from "@/components/composer/composer";
import { WORKSPACES } from "@/components/design-system/sidebar-samples";
import { Section, Specimen } from "@/components/design-system/specimen";
import { AddressStatus } from "@/components/environment/address-status";
import { sampleCleanBases } from "@/components/design-system/project-samples";
import { CleanBaseFailedDialog } from "@/components/environment/clean-base-failed-dialog";
import { EnvBanner, type EnvBannerState } from "@/components/environment/env-banner";
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
import { failureSteps } from "@/lib/clean-base";
import { TaskCard } from "@/components/task/task-card";
import { TaskEmptyState } from "@/components/task/task-empty-state";
import { TaskHeader, type TaskStatus } from "@/components/task/task-header";
import { TaskTabBar, type TaskView } from "@/components/task/task-tab-bar";

const MONOKU = { name: "Monoku", color: "#33843F" };

const CLEAN_BASES = sampleCleanBases(Date.now());

const SERVICES: TaskService[] = [
  { name: "web", detail: "", url: "https://monoku-fix-login.nex", state: "up" },
  { name: "api", detail: "", url: "https://api.monoku-fix-login.nex", state: "up" },
  { name: "postgres", detail: ":5432 · inside the task", state: "up" },
  { name: "redis", detail: ":6379 · inside the task", state: "up" },
];

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
  menuOpen = false,
}: {
  env: EnvState;
  status?: TaskStatus;
  banner?: EnvBannerState;
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
              label="monoku-fix-login.nex · 4 services"
              services={SERVICES.map((service) => ({
                ...service,
                state: env === "paused" ? "paused" : service.state,
              }))}
              defaultOpen={menuOpen}
            />
            <Chip>test</Chip>
            <CountChip count={3} />
          </>
        }
      />
      {banner && <EnvBanner state={banner} />}
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

export function Environments() {
  return (
    <Section
      id="environments"
      title="Environments on tasks"
      description="Each task's environment shows up in the globe of its tab bar, a strip under it when something needs you, the empty task while it starts, and the sidebar's memory meter."
    >
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
                  { name: "Clean base", state: "done" },
                  { name: "postgres", state: "done" },
                  { name: "api", state: "running" },
                  { name: "web", state: "pending" },
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
              banner={{ kind: "waiting", used: "7.4 of 8 GB", suggestion: "usage-panel" }}
            />
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
                addresses: ["monoku-fix-login.nex", "api.monoku-fix-login.nex"],
                readyIn: "3.1s",
              }}
            />
          </Labeled>
          <Labeled label="No room · three environments already running">
            <EmptyTask state={{ kind: "waiting", running: 3, max: 3, suggestion: "usage-panel" }} />
          </Labeled>
          <Labeled label="Old clean base · runs the new migrations from main first">
            <EmptyTask
              state={{ kind: "migrating", step: 3, total: 4, migrations: 2, baseDate: "Oct 14" }}
            />
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
          <CleanBaseFailedDialog
            failure={{
              project: "atlas",
              error: CLEAN_BASES.failed.error ?? "",
              steps: failureSteps(CLEAN_BASES.failed),
            }}
          />
          <CloseTaskDialog
            task={{
              title: "Fix login redirect param",
              branch: "feat/fix-login-redirect",
              uncommitted: 3,
              environment: { size: "240 MB", address: "monoku-fix-login.nex" },
            }}
          />
        </div>
      </Specimen>
    </Section>
  );
}
