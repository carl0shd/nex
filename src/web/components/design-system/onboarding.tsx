import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/button";
import { SegmentedControl } from "@/components/atoms/segmented-control";
import { SAMPLE_ENVIRONMENT } from "@/components/design-system/project-samples";
import { WORKSPACES } from "@/components/design-system/sidebar-samples";
import { Section, Specimen } from "@/components/design-system/specimen";
import { WaitingCardSample, WorkingCardSample } from "@/components/design-system/task-card-samples";
import { AddAgentSlot } from "@/components/home/add-agent-slot";
import { AddAccountDialog, type AddAccountStage } from "@/components/onboarding/add-account-dialog";
import { AgentStep, type ClaudeInstall } from "@/components/onboarding/agent-step";
import { FirstRunCard } from "@/components/onboarding/first-run-card";
import type { CheckItem } from "@/components/onboarding/check-list";
import type { EnvSetup } from "@/components/onboarding/environments-step";
import { OnboardingFlow, type OnboardingData } from "@/components/onboarding/onboarding-flow";
import { Sidebar } from "@/components/sidebar/sidebar";
import { foundServices } from "@/lib/project-environment";
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
  services: foundServices(SAMPLE_ENVIRONMENT),
  serviceSources: SAMPLE_ENVIRONMENT.detectedFrom,
  envTasks: [
    { branch: "feat/fix-login-redirect", address: "monoku-fix-login.nex", startedIn: "2.1s" },
    { branch: "feat/usage-panel", address: "monoku-usage-panel.nex", startedIn: "1.8s" },
    { branch: "feat/accounts-table", address: "monoku-accounts-table.nex", startedIn: "2.4s" },
  ],
  envRuntime: "Container runtime made by Apple · about 160 MB",
  model: "Opus 5.5",
  mode: "Ask first",
};

const STEP_MS = 1100;
const FAIL_AT = 2;

const SIM_STEPS = [
  {
    pending: "Install Apple container",
    done: "Apple container 1.7.1 installed",
    runningDetail: "Downloading · 64 of 158 MB",
  },
  {
    pending: "Start Apple container",
    done: "Apple container running",
    runningDetail: "Installs the Linux kernel the first time.",
  },
  {
    pending: "Register .nex addresses",
    done: ".nex addresses registered",
    runningDetail: "Confirm with your password in the macOS dialog.",
  },
  {
    pending: "Check that a task can run",
    done: "A test container ran and answered",
    runningDetail: "Starts a test container and opens its .nex address.",
    doneDetail: "nexcheck-mh2k.check.nex · started in 0.6s",
  },
];

interface Simulation {
  phase: EnvSetup["phase"];
  current: number;
  leftLabel?: string;
  took?: string;
}

function simulatedSteps({ phase, current }: Simulation): CheckItem[] {
  return SIM_STEPS.map((step, index) => {
    if (index < current || phase === "ready")
      return { label: step.done, detail: step.doneDetail, state: "done" };
    if (index === current && phase === "failed")
      return { label: step.pending, detail: "The password dialog was closed.", state: "failed" };
    if (index === current && phase === "running")
      return { label: step.pending, detail: step.runningDetail, state: "running" };
    return { label: step.pending, state: "pending" };
  });
}

function toSetup(simulation: Simulation): EnvSetup {
  return {
    ...simulation,
    steps: simulatedSteps(simulation),
    failure: {
      title: "Couldn’t register .nex addresses",
      description: "The password dialog was closed.",
    },
    unsupported: {
      title: "Environments need macOS 26",
      description: "This Mac runs macOS 15.6. Apple container only works on macOS 26 and later.",
    },
  };
}

function useEnvSimulation(scenario: EnvScenario) {
  const [simulation, setSimulation] = useState<Simulation>(() => ({
    phase: scenario === "old-macos" ? "unsupported" : "offer",
    current: 0,
  }));

  useEffect(() => {
    if (simulation.phase !== "running") return;
    const timer = setTimeout(() => {
      const current = simulation.current + 1;
      if (scenario === "password" && simulation.current === FAIL_AT) {
        setSimulation({ ...simulation, phase: "failed" });
      } else if (current >= SIM_STEPS.length) {
        setSimulation({ ...simulation, phase: "ready", current, took: "38s" });
      } else {
        setSimulation({
          ...simulation,
          current,
          leftLabel: "Less than a minute left",
        });
      }
    }, STEP_MS);
    return () => clearTimeout(timer);
  }, [simulation, scenario]);

  return {
    setup: toSetup(simulation),
    start: () =>
      setSimulation({ ...simulation, phase: "running", current: 0, leftLabel: "About 1 min left" }),
    retry: () =>
      setSimulation({ ...simulation, phase: "running", leftLabel: "Less than a minute left" }),
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
      <FirstRunCard
        className="absolute right-5 bottom-5"
        tips={[
          { keys: "⌘T", label: "Start another task" },
          { keys: "⌘K", label: "Jump to any task, file or action" },
          { keys: "⇧ scroll", label: "Move between agents on the overview" },
        ]}
      />
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
      ready={() => <ReadyHome />}
    />
  );
}

const AGENT_CASES: { label: string; install: ClaudeInstall; git: string | null }[] = [
  {
    label: "Ready · Claude installed and signed in, git found",
    install: INSTALLS.ready,
    git: "2.47",
  },
  {
    label: "Installed, not signed in · run claude in a terminal, Nex checks every 3s",
    install: INSTALLS["signed-out"],
    git: "2.47",
  },
  {
    label: "Claude Code missing · install command, Nex checks every 3s",
    install: INSTALLS.missing,
    git: "2.47",
  },
  {
    label: "Git missing · xcode-select --install, Continue stays off until git shows up",
    install: INSTALLS.ready,
    git: null,
  },
];

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
      description="Welcome, then five steps: Claude, workspace, project, environments and the first task. ⌘↵ continues on every step."
    >
      <Specimen name="OnboardingFlow · switch the scenarios, then walk through it" bare>
        <OnboardingDemo />
      </Specimen>
      <Specimen name="Agent step · every case" bare>
        <div className="flex w-full flex-col gap-8">
          {AGENT_CASES.map(({ label, install, git }) => (
            <div key={label} className="flex flex-col gap-3">
              <span className="text-xs text-ink-4">{label}</span>
              <div className="flex h-[640px] w-full overflow-hidden rounded-card bg-page shadow-card">
                <AgentStep install={install} git={git} />
              </div>
            </div>
          ))}
        </div>
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
