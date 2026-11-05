import { Fragment } from "react";
import { Check } from "lucide-react";
import { useOnboardingSteps } from "@/components/onboarding/onboarding-steps";
import { cn } from "@/lib/utils";

const DRAG = { WebkitAppRegion: "drag" } as React.CSSProperties;

function StepMark({ index, current }: { index: number; current: number }) {
  const done = index < current;
  const active = index === current;
  return (
    <span
      className={cn(
        "flex size-[18px] items-center justify-center rounded-full text-3xs font-semibold transition-colors duration-200",
        done && "bg-accent text-on-accent",
        active && "bg-accent-tint text-accent-ink shadow-[inset_0_0_0_1px_var(--green)]",
        !done && !active && "text-ink-4 shadow-[inset_0_0_0_1px_var(--line-strong)]",
      )}
    >
      {done ? <Check width={10} height={10} strokeWidth={3.5} /> : index}
    </span>
  );
}

export function OnboardingChrome({ step }: { step: number }) {
  const steps = useOnboardingSteps();
  return (
    <header className="relative z-10 flex h-12 shrink-0 items-center" style={DRAG}>
      {step > 0 && (
        <ol
          aria-label="Setup progress"
          className="absolute left-1/2 m-0 flex -translate-x-1/2 list-none items-center gap-2.5 p-0"
        >
          {steps.map((label, offset) => {
            const index = offset + 1;
            return (
              <Fragment key={label}>
                {offset > 0 && (
                  <span
                    aria-hidden
                    className={cn(
                      "h-px w-7 transition-colors duration-200",
                      index <= step ? "bg-green/50" : "bg-line-strong",
                    )}
                  />
                )}
                <li
                  aria-current={index === step ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-[7px] text-xs font-medium whitespace-nowrap",
                    index === step ? "text-ink" : index < step ? "text-ink-2" : "text-ink-4",
                  )}
                >
                  <StepMark index={index} current={step} />
                  {label}
                </li>
              </Fragment>
            );
          })}
        </ol>
      )}
    </header>
  );
}
