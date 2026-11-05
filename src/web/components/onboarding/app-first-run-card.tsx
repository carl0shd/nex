import { FirstRunCard } from "@/components/onboarding/first-run-card";
import { shortcutLabel } from "@/lib/app-shortcuts";
import { useOnboardingStore } from "@/stores/onboarding.store";

export function AppFirstRunCard() {
  const firstTaskStarted = useOnboardingStore((s) => s.firstTaskStarted);
  const markFirstTaskStarted = useOnboardingStore((s) => s.markFirstTaskStarted);
  if (!firstTaskStarted) return null;
  return (
    <FirstRunCard
      className="absolute right-5 bottom-5 z-30"
      tips={[
        { keys: shortcutLabel("new-task"), label: "Start another task" },
        { keys: shortcutLabel("workspace"), label: "Add another workspace" },
        { keys: shortcutLabel("sidebar"), label: "Show or hide the sidebar" },
      ]}
      onDismiss={() => markFirstTaskStarted(false)}
    />
  );
}
