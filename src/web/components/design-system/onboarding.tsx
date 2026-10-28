import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/button";
import { SegmentedControl } from "@/components/atoms/segmented-control";
import { WORKSPACES } from "@/components/design-system/sidebar-samples";
import { Section, Specimen } from "@/components/design-system/specimen";
import { FIRST_RUN } from "@/components/design-system/toast-samples";
import { WaitingCardSample, WorkingCardSample } from "@/components/design-system/task-card-samples";
import { AddAgentSlot } from "@/components/home/add-agent-slot";
import { AddAccountDialog, type AddAccountStage } from "@/components/onboarding/add-account-dialog";
import type { ClaudeInstall } from "@/components/onboarding/agent-step";
import type { EnvSetup } from "@/components/onboarding/environments-step";
import { OnboardingFlow, type OnboardingData } from "@/components/onboarding/onboarding-flow";
import { Toast } from "@/components/primitives/toast";
import { Sidebar } from "@/components/sidebar/sidebar";
import type { SidebarWorkspace } from "@/components/sidebar/types";

type ClaudeScenario = "ready" | "signed-out" | "missing";
type EnvScenario = "works" | "password" | "old-macos";

const INSTALLS: Record<ClaudeScenario, ClaudeInstall> = {
  ready: {
    state: "ready",
    version: "2.4.1",
    path: "/opt/homebrew/bin/claude",
    accounts: [
      {
        id: "monoku",
        name: "Monoku",
        email: "you@monoku.com",
        color: "#33843F",
        usedPercent: 62,
        isDefault: true,
      },
    ],
  },
  "signed-out": { state: "signed-out", version: "2.4.1", path: "/opt/homebrew/bin/claude" },
  missing: { state: "missing", installCommand: "curl -fsSL https://claude.ai/install.sh | bash" },
};

const DATA: Omit<OnboardingData, "install"> = {
  git: "2.47",
  project: {
    name: "nex",
    path: "~/code/nex",
    branch: "main",
    clean: true,
    branchPrefix: "feat/",
    commands: [
      { name: "dev", on: true },
      { name: "test", on: true },
      { name: "lint", on: true },
      { name: "typecheck", on: false },
      { name: "build", on: false },
    ],
  },
  services: [
    { name: "web", detail: "yarn dev · :5173", address: "monoku-task.nex" },
    { name: "api", detail: "yarn api · :8000", address: "api.monoku-task.nex" },
    { name: "postgres", detail: "16 · seeds from db/seed.sql" },
    { name: "redis", detail: "7" },
  ],
  envTasks: [
    { branch: "feat/fix-login-redirect", address: "monoku-fix-login.nex", startedIn: "2.1s" },
    { branch: "feat/usage-panel", address: "monoku-usage-panel.nex", startedIn: "1.8s" },
    { branch: "feat/accounts-table", address: "monoku-accounts-table.nex", startedIn: "2.4s" },
  ],
  model: "Opus 5.5",
  mode: "Ask first",
};

const STEP_MS = 1100;
const FAIL_AT = 2;
const SETUP_STEPS = 5;

function initialSetup(scenario: EnvScenario): EnvSetup {
  return { phase: scenario === "old-macos" ? "unsupported" : "offer", current: 0, macos: "15.6" };
}

function useEnvSimulation(scenario: EnvScenario) {
  const [setup, setSetup] = useState<EnvSetup>(() => initialSetup(scenario));

  useEffect(() => {
    if (setup.phase !== "running") return;
    const timer = setTimeout(() => {
      const current = setup.current + 1;
      if (scenario === "password" && setup.current === FAIL_AT) {
        setSetup({ ...setup, phase: "failed" });
      } else if (current >= SETUP_STEPS) {
        setSetup({ ...setup, phase: "ready", current, took: "1 min 48s" });
      } else {
        setSetup({
          ...setup,
          current,
          leftLabel: `About ${Math.ceil((SETUP_STEPS - current) / 2)} min left`,
        });
      }
    }, STEP_MS);
    return () => clearTimeout(timer);
  }, [setup, scenario]);

  return {
    setup,
    start: () =>
      setSetup({ ...setup, phase: "running", current: 0, leftLabel: "About 2 min left" }),
    retry: () => setSetup({ ...setup, phase: "running", leftLabel: "About 1 min left" }),
  };
}

function HomePreview() {
  return (
    <div className="flex h-full bg-page">
      <Sidebar workspaces={WORKSPACES} />
      <div className="flex gap-2.5 pt-9 pl-3">
        <WorkingCardSample />
        <WaitingCardSample />
      </div>
    </div>
  );
}

const FIRST_WORKSPACE: SidebarWorkspace[] = [
  {
    id: "monoku",
    name: "Monoku",
    color: "#33843F",
    expanded: true,
    projects: [
      {
        name: "nex",
        tasks: [
          {
            id: "fix-login-redirect",
            title: "Fix login redirect param",
            status: "running",
            meta: "now",
          },
        ],
      },
    ],
  },
];

function ReadyHome() {
  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <Sidebar workspaces={FIRST_WORKSPACE} activeTaskId="fix-login-redirect" />
      <div className="flex gap-2.5 pt-9 pl-3">
        <WorkingCardSample />
        <div className="h-[788px]">
          <AddAgentSlot />
        </div>
      </div>
      <Toast {...FIRST_RUN} className="absolute right-5 bottom-5" />
    </div>
  );
}

function signInDemo() {
  return new Promise<{ name: string; email: string; color: string }>((resolve) =>
    setTimeout(
      () => resolve({ name: "Studio Labs", email: "you@studio.dev", color: "#3f6fb5" }),
      1800,
    ),
  );
}

function OnboardingDemo() {
  const [claude, setClaude] = useState<ClaudeScenario>("ready");
  const [env, setEnv] = useState<EnvScenario>("works");
  const [run, setRun] = useState(0);
  const key = `${claude}-${env}-${run}`;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-3">
        <span className="flex items-center gap-2">
          Claude
          <SegmentedControl
            options={["ready", "signed-out", "missing"] as const}
            labels={{ ready: "Signed in", "signed-out": "Not signed in", missing: "Not installed" }}
            value={claude}
            onChange={setClaude}
            size="sm"
          />
        </span>
        <span className="flex items-center gap-2">
          Environments
          <SegmentedControl
            options={["works", "password", "old-macos"] as const}
            labels={{ works: "Works", password: "Password closed", "old-macos": "macOS 15" }}
            value={env}
            onChange={setEnv}
            size="sm"
          />
        </span>
        <Button size="sm" variant="quiet" onClick={() => setRun((value) => value + 1)}>
          Start over
        </Button>
      </div>
      <div className="h-[900px] w-full overflow-hidden rounded-card shadow-card">
        <FlowWithEnvironments key={key} claude={claude} env={env} />
      </div>
    </div>
  );
}

function FlowWithEnvironments({ claude, env }: { claude: ClaudeScenario; env: EnvScenario }) {
  const { setup, start, retry } = useEnvSimulation(env);
  return (
    <OnboardingFlow
      data={{ ...DATA, install: INSTALLS[claude] }}
      envSetup={setup}
      onEnvSetUp={start}
      onEnvRetry={retry}
      signIn={signInDemo}
      welcomePreview={<HomePreview />}
      connectPreview={<WaitingCardSample />}
      ready={() => <ReadyHome />}
    />
  );
}

const STAGES: { label: string; state: AddAccountStage }[] = [
  { label: "1 · Sign in with the Claude account", state: { stage: "intro" } },
  { label: "2 · Waiting for the browser", state: { stage: "waiting" } },
  {
    label: "3 · Done: name, color and default",
    state: {
      stage: "signed-in",
      account: { name: "Studio Labs", email: "you@studio.dev", color: "#3f6fb5" },
    },
  },
  {
    label: "Already added",
    state: {
      stage: "exists",
      account: { name: "Monoku", email: "you@monoku.com", color: "#33843F" },
    },
  },
  { label: "Didn’t finish (tab closed or 5 min passed)", state: { stage: "failed" } },
  {
    label: "Login expired: sign in again with the email filled in",
    state: {
      stage: "expired",
      account: { name: "Studio", email: "you@studio.dev", color: "#3f6fb5" },
      pausedTasks: 2,
    },
  },
];

export function Onboarding() {
  return (
    <Section
      id="first-run"
      title="First run"
      description="Welcome, then six steps: Claude, live view hooks, workspace, project, environments and the first task. ⌘↵ continues on every step."
    >
      <Specimen name="OnboardingFlow · switch the scenarios, then walk through it" bare>
        <OnboardingDemo />
      </Specimen>
      <Specimen name="AddAccountDialog · every stage" bare>
        <div className="flex w-full flex-wrap items-start gap-x-10 gap-y-10">
          {STAGES.map(({ label, state }) => (
            <div key={label} className="flex flex-col gap-3">
              <span className="text-xs text-ink-4">{label}</span>
              <AddAccountDialog state={state} />
            </div>
          ))}
        </div>
      </Specimen>
    </Section>
  );
}
