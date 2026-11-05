import { createContext, useContext } from "react";

export const ONBOARDING_STEPS = [
  "Agent",
  "Workspace",
  "Project",
  "Environments",
  "First task",
] as const;

export type OnboardingStepName = (typeof ONBOARDING_STEPS)[number];

export const OnboardingStepsContext =
  createContext<readonly OnboardingStepName[]>(ONBOARDING_STEPS);

export function useOnboardingSteps() {
  return useContext(OnboardingStepsContext);
}
