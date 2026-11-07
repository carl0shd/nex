import { useRef, useState } from "react";
import { DitherBackdrop } from "@/components/atoms/dither-backdrop";
import { AppAgentStep } from "@/components/onboarding/app-agent-step";
import { AppFirstTaskStep } from "@/components/onboarding/app-first-task-step";
import { AppProjectStep } from "@/components/onboarding/app-project-step";
import { AppWorkspaceStep } from "@/components/onboarding/app-workspace-step";
import { OnboardingChrome } from "@/components/onboarding/onboarding-chrome";
import {
  OnboardingStepsContext,
  type OnboardingStepName,
} from "@/components/onboarding/onboarding-steps";
import { WelcomeScreen } from "@/components/onboarding/welcome-screen";

const STEPS: readonly OnboardingStepName[] = ["Agent", "Workspace", "Project", "First task"];

type Screen = "welcome" | "agent" | "workspace" | "project" | "first-task";

const SCREENS: readonly Screen[] = ["welcome", "agent", "workspace", "project", "first-task"];

export function AppOnboarding({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [welcomeVisit, setWelcomeVisit] = useState(0);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const screen = SCREENS[index];
  const next = () => (index + 1 < SCREENS.length ? setIndex(index + 1) : onDone());
  const back = () => {
    if (index === 1) setWelcomeVisit(welcomeVisit + 1);
    setIndex(Math.max(0, index - 1));
  };

  return (
    <OnboardingStepsContext.Provider value={STEPS}>
      <div className="relative flex h-screen flex-col bg-page">
        <DitherBackdrop
          key={welcomeVisit}
          anchorRef={logoRef}
          fadeOut={screen !== "welcome"}
          className="fixed"
        />
        <OnboardingChrome step={index} onSkip={onDone} />
        {screen === "welcome" && <WelcomeScreen logoRef={logoRef} onStart={next} />}
        {screen === "agent" && <AppAgentStep onBack={back} onContinue={next} />}
        {screen === "workspace" && (
          <AppWorkspaceStep
            workspaceId={workspaceId}
            onBack={back}
            onContinue={(id) => {
              setWorkspaceId(id);
              next();
            }}
          />
        )}
        {screen === "project" && workspaceId && (
          <AppProjectStep
            workspaceId={workspaceId}
            projectId={projectId}
            onBack={back}
            onSkip={onDone}
            onContinue={(id) => {
              setProjectId(id);
              next();
            }}
          />
        )}
        {screen === "first-task" && projectId && (
          <AppFirstTaskStep projectId={projectId} onBack={back} onDone={onDone} />
        )}
      </div>
    </OnboardingStepsContext.Provider>
  );
}
