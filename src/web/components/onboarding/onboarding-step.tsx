import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/atoms/button";
import { ONBOARDING_STEPS } from "@/components/onboarding/onboarding-steps";

export interface StepAction {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function OnboardingStep({
  step,
  title,
  description,
  children,
  aside,
  onBack,
  primary,
  secondary,
  note,
}: {
  step: number;
  title: string;
  description: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  onBack?: () => void;
  primary: StepAction;
  secondary?: StepAction;
  note?: string;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Enter" && event.metaKey && !primary.disabled) {
        event.preventDefault();
        primary.onClick?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [primary]);

  return (
    <main className="grid min-h-0 flex-1 grid-cols-[480px_minmax(0,600px)] content-center justify-center gap-x-20 overflow-y-auto px-10 pb-12">
      <div key={step} className="rise-in flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <span className="text-xs font-medium text-ink-3">
            Step {step} of {ONBOARDING_STEPS.length}
          </span>
          <h1 className="m-0 text-2xl font-semibold tracking-[-0.025em] text-ink">{title}</h1>
          <p className="m-0 text-base leading-[21px] text-ink-3">{description}</p>
        </header>
        {children}
        <div className="flex items-center gap-2">
          {onBack && <Button onClick={onBack}>Back</Button>}
          {note && <span className="ml-auto text-xs text-ink-4">{note}</span>}
          {secondary && (
            <Button
              variant="quiet"
              onClick={secondary.onClick}
              disabled={secondary.disabled}
              className={note ? undefined : "ml-auto"}
            >
              {secondary.label}
            </Button>
          )}
          <Button
            variant="primary"
            kbd="⌘↵"
            onClick={primary.onClick}
            disabled={primary.disabled}
            className={note || secondary ? undefined : "ml-auto"}
          >
            {primary.label}
          </Button>
        </div>
      </div>
      {aside && (
        <div key={`aside-${step}`} className="rise-in [animation-delay:120ms]">
          {aside}
        </div>
      )}
    </main>
  );
}
