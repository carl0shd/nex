import type { ReactNode } from "react";
import { CheckList } from "@/components/onboarding/check-list";
import { OnboardingStep } from "@/components/onboarding/onboarding-step";
import { cn } from "@/lib/utils";

const GAINS = [
  "Tool calls, edits and test runs appear in the card as they happen",
  "Approve or deny permission prompts right from the overview",
  "A notification the moment an agent is waiting on you",
];

const HOOKS: readonly [boolean, string][] = [
  [false, '"hooks": {'],
  [true, '  "PreToolUse":   [{ "command": "nex-hook pre" }],'],
  [true, '  "PostToolUse":  [{ "command": "nex-hook post" }],'],
  [true, '  "Notification": [{ "command": "nex-hook notify" }],'],
  [true, '  "Stop":         [{ "command": "nex-hook stop" }]'],
  [false, "}"],
];

function SettingsDiff({ file }: { file: string }) {
  return (
    <figure className="m-0 overflow-hidden rounded-menu bg-inset shadow-[inset_0_0_0_1px_var(--line-strong)]">
      <figcaption className="flex h-[34px] items-center gap-2 border-b border-line px-3 text-xs text-ink-3">
        What changes
        <span className="ml-auto font-mono text-2xs text-ink-4">{file}</span>
      </figcaption>
      <div className="py-2.5 font-mono text-2xs leading-[19px]">
        {HOOKS.map(([added, code]) => (
          <div
            key={code}
            className={cn("flex pr-3", added ? "bg-green-tint text-ink" : "text-ink-3")}
          >
            <span className="w-[22px] shrink-0 text-center text-green">{added ? "+" : ""}</span>
            <span className="whitespace-pre">{code}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

export function ConnectStep({
  preview,
  onBack,
  onConnect,
  onSkip,
}: {
  preview: ReactNode;
  onBack?: () => void;
  onConnect?: () => void;
  onSkip?: () => void;
}) {
  return (
    <OnboardingStep
      step={2}
      title="Let Nex see what Claude is doing"
      description="Nex adds a few Claude Code hooks so every card shows the agent's work live, and you can answer it without opening a terminal."
      onBack={onBack}
      note="Undo anytime in Settings"
      secondary={{ label: "Not now", onClick: onSkip }}
      primary={{ label: "Connect", onClick: onConnect }}
      aside={
        <div
          aria-label="Preview of a live card"
          className="h-[700px] overflow-hidden rounded-panel"
        >
          {preview}
        </div>
      }
    >
      <CheckList
        items={GAINS.map((label) => ({ label, state: "done" as const }))}
        className="gap-0 [&_span]:text-ink-2"
      />
      <SettingsDiff file="~/.claude/settings.json" />
    </OnboardingStep>
  );
}
