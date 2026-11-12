import { useState, type ReactNode } from "react";
import {
  AddAccountDialog,
  type AddAccountStage,
  type SignedInAccount,
} from "@/components/onboarding/add-account-dialog";
import { AgentStep, type ClaudeInstall } from "@/components/onboarding/agent-step";
import {
  EnvironmentsStep,
  type EnvService,
  type EnvSetup,
  type EnvTask,
} from "@/components/onboarding/environments-step";
import { FirstTaskStep, type FirstTaskDraft } from "@/components/onboarding/first-task-step";
import { OnboardingChrome } from "@/components/onboarding/onboarding-chrome";
import { ProjectStep, type ProjectDraft } from "@/components/onboarding/project-step";
import { WelcomeScreen } from "@/components/onboarding/welcome-screen";
import { WorkspaceStep, type WorkspaceDraft } from "@/components/onboarding/workspace-step";
import { Overlay } from "@/components/primitives/overlay";
import { cn } from "@/lib/utils";

export interface OnboardingData {
  install: ClaudeInstall;
  git: string;
  project: ProjectDraft;
  services: readonly EnvService[];
  serviceSources?: readonly string[];
  envTasks: readonly EnvTask[];
  envRuntime: string;
  model: string;
  mode: string;
}

export interface OnboardingResult {
  workspace: WorkspaceDraft;
  project: ProjectDraft;
  firstTask: FirstTaskDraft | null;
}

const READY = 6;

export function OnboardingFlow({
  data,
  envSetup,
  onEnvSetUp,
  onEnvRetry,
  signIn,
  welcomePreview,
  ready,
  initialStep = 0,
  onFinish,
  className,
}: {
  data: OnboardingData;
  envSetup: EnvSetup;
  onEnvSetUp?: () => void;
  onEnvRetry?: () => void;
  signIn: () => Promise<SignedInAccount>;
  welcomePreview?: ReactNode;
  ready: (result: OnboardingResult) => ReactNode;
  initialStep?: number;
  onFinish?: (result: OnboardingResult) => void;
  className?: string;
}) {
  const [step, setStep] = useState(initialStep);
  const [install, setInstall] = useState(data.install);
  const [dialog, setDialog] = useState<AddAccountStage | null>(null);
  const [memory, setMemory] = useState("8");
  const [workspace, setWorkspace] = useState<WorkspaceDraft>({
    name: "Monoku",
    color: "#33843F",
    image: null,
  });
  const [project, setProject] = useState(data.project);
  const [task, setTask] = useState<FirstTaskDraft>({
    title: "Fix login redirect param",
    message: "The redirect after login drops the ?next= param. Fix it and add a test.",
  });
  const [startedTask, setStartedTask] = useState<FirstTaskDraft | null>(null);

  const next = () => setStep((value) => value + 1);
  const back = () => setStep((value) => Math.max(0, value - 1));
  const result: OnboardingResult = { workspace, project, firstTask: startedTask };
  const finish = (firstTask: FirstTaskDraft | null) => {
    setStartedTask(firstTask);
    setStep(READY);
    onFinish?.({ workspace, project, firstTask });
  };

  const defaultAccount =
    install.state === "ready"
      ? (install.accounts.find((account) => account.isDefault) ?? install.accounts[0])
      : undefined;

  const startSignIn = () => {
    setDialog({ stage: "waiting" });
    signIn()
      .then((account) => setDialog({ stage: "signed-in", account }))
      .catch(() => setDialog({ stage: "failed" }));
  };

  const addAccount = (account: SignedInAccount & { isDefault: boolean }) => {
    if (install.state !== "ready") return setDialog(null);
    setInstall({
      ...install,
      accounts: [
        ...install.accounts.map((item) =>
          account.isDefault ? { ...item, isDefault: false } : item,
        ),
        {
          id: account.email,
          name: account.name,
          email: account.email,
          color: account.color,
          usedPercent: 0,
          isDefault: account.isDefault,
        },
      ],
    });
    setDialog(null);
  };

  return (
    <div className={cn("relative flex h-full flex-col bg-page", className)}>
      {step < READY && <OnboardingChrome step={step} onSkip={() => finish(null)} />}
      {step === 0 && <WelcomeScreen preview={welcomePreview} onStart={next} />}
      {step === 1 && (
        <AgentStep
          install={install}
          git={data.git}
          onBack={back}
          onContinue={next}
          onAddAccount={() => setDialog({ stage: "intro" })}
        />
      )}
      {step === 2 && (
        <WorkspaceStep
          workspace={workspace}
          onChange={setWorkspace}
          onBack={back}
          onContinue={next}
        />
      )}
      {step === 3 && (
        <ProjectStep project={project} onChange={setProject} onBack={back} onAdd={next} />
      )}
      {step === 4 && (
        <EnvironmentsStep
          project={project.name}
          services={data.services}
          sources={data.serviceSources}
          tasks={data.envTasks}
          memory={memory}
          runtimeDetail={data.envRuntime}
          onMemoryChange={setMemory}
          setup={envSetup}
          onBack={back}
          onSetUp={onEnvSetUp}
          onRetry={onEnvRetry}
          onContinue={next}
        />
      )}
      {step === 5 && (
        <FirstTaskStep
          draft={task}
          onChange={setTask}
          context={{
            project: project.name,
            workspace,
            account: defaultAccount?.name ?? "Claude",
            model: data.model,
            mode: data.mode,
            branchPrefix: project.branchPrefix,
          }}
          onBack={back}
          onSkip={() => finish(null)}
          onStart={() => finish(task)}
        />
      )}
      {step === READY && ready(result)}
      {dialog && (
        <Overlay onClose={() => setDialog(null)}>
          <AddAccountDialog
            state={dialog}
            onContinue={startSignIn}
            onOpenAgain={startSignIn}
            onRetry={() => setDialog({ stage: "intro" })}
            onAdd={addAccount}
            onClose={() => setDialog(null)}
          />
        </Overlay>
      )}
    </div>
  );
}
