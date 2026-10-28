import { InfoCircle, Lock, OpenNewWindow, Plus } from "iconoir-react";
import { ClaudeTile } from "@/components/atoms/agent-tile";
import { Button } from "@/components/atoms/button";
import { Monogram } from "@/components/atoms/entity-chip";
import { Meter } from "@/components/atoms/meter";
import { Orbit } from "@/components/atoms/orbit";
import { ValuePill } from "@/components/atoms/value-pill";
import { CheckList, type CheckItem } from "@/components/onboarding/check-list";
import { CommandBox } from "@/components/onboarding/command-box";
import { OnboardingPanel } from "@/components/onboarding/onboarding-panel";
import { OnboardingStep } from "@/components/onboarding/onboarding-step";
import type { ClaudeAccount } from "@/components/settings/account-list";
import { usageTone } from "@/lib/usage";

export type ClaudeInstall =
  | { state: "ready"; version: string; path: string; accounts: readonly ClaudeAccount[] }
  | { state: "signed-out"; version: string; path: string }
  | { state: "missing"; installCommand: string };

const INSTALL_BADGE = {
  ready: { label: "Detected", tone: "green" },
  "signed-out": { label: "Detected", tone: "green" },
  missing: { label: "Missing", tone: "orange" },
} as const;

function foundItems(install: ClaudeInstall, git: string): CheckItem[] {
  const account =
    install.state === "ready" ? install.accounts.find((item) => item.isDefault) : null;
  return [
    install.state === "missing"
      ? { label: "Claude Code", detail: "not found in your PATH", state: "failed" }
      : { label: `Claude Code ${install.version}`, detail: install.path, state: "done" },
    account
      ? {
          label: `Signed in as ${account.email}`,
          detail: "~/.claude",
          state: "done",
          trailing: <Meter value={account.usedPercent} tone={usageTone(account.usedPercent)} />,
        }
      : { label: "Claude account", detail: "not signed in yet", state: "pending" },
    { label: `Git ${git}`, detail: "worktrees supported", state: "done" },
    { label: "Live view hooks", detail: "not installed yet · next step", state: "skipped" },
  ];
}

export function AgentStep({
  install,
  git,
  onBack,
  onContinue,
  onAddAccount,
  onSignIn,
}: {
  install: ClaudeInstall;
  git: string;
  onBack?: () => void;
  onContinue?: () => void;
  onAddAccount?: () => void;
  onSignIn?: () => void;
}) {
  const badge = INSTALL_BADGE[install.state];
  return (
    <OnboardingStep
      step={1}
      title="Connect Claude"
      description={
        install.state === "ready"
          ? "Nex runs Claude Code with your own accounts. This is what we found on this Mac."
          : "Nex runs Claude Code with your own accounts."
      }
      onBack={onBack}
      primary={{ label: "Continue", onClick: onContinue, disabled: install.state !== "ready" }}
      aside={
        <OnboardingPanel
          title="What Nex found"
          meta="Scanned in 0.4s"
          footer={
            <>
              <Lock width={13} height={13} strokeWidth={2} />
              Nex only reads local config. Nothing leaves your Mac.
            </>
          }
        >
          <CheckList items={foundItems(install, git)} mono className="px-[18px] py-3" />
        </OnboardingPanel>
      }
    >
      <div className="overflow-hidden rounded-panel bg-surface shadow-card">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <ClaudeTile size={32} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-base font-medium text-ink">Claude Code</span>
            {install.state === "missing" ? (
              <span className="text-xs text-ink-3">Not found on this Mac</span>
            ) : (
              <span className="truncate font-mono text-2xs text-ink-4">
                v{install.version} · {install.path}
              </span>
            )}
          </span>
          <ValuePill tone={badge.tone}>{badge.label}</ValuePill>
        </div>

        {install.state === "ready" && (
          <>
            {install.accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 border-t border-line px-3.5 py-3"
              >
                <Monogram size="lg" color={account.color}>
                  {account.name[0]}
                </Monogram>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-ink">
                    {account.name}
                    {account.isDefault && <ValuePill tone="accent">Default</ValuePill>}
                  </span>
                  <span className="truncate font-mono text-2xs text-ink-4">{account.email}</span>
                </span>
                <ValuePill>Signed in</ValuePill>
              </div>
            ))}
            <div className="border-t border-line px-2 pt-1.5 pb-2">
              <Button variant="quiet" size="sm" onClick={onAddAccount}>
                <Plus width={12} height={12} strokeWidth={2.25} />
                Add another account
              </Button>
            </div>
          </>
        )}

        {install.state === "signed-out" && (
          <div className="flex flex-col gap-3 border-t border-line px-4 py-3.5">
            <p className="m-0 text-sm leading-[19px] text-ink-2">
              Claude Code is installed but not signed in on this Mac. Sign in with your Pro, Max,
              Team or Enterprise account.
            </p>
            <Button variant="primary" size="sm" onClick={onSignIn} className="self-end">
              Sign in with Claude
              <OpenNewWindow width={12} height={12} strokeWidth={2} />
            </Button>
          </div>
        )}

        {install.state === "missing" && (
          <div className="flex flex-col gap-3 border-t border-line px-4 py-3.5">
            <p className="m-0 text-sm text-ink-2">
              Install it in a terminal, then come back. Nex checks again on its own.
            </p>
            <CommandBox command={install.installCommand} />
            <div className="flex items-center gap-2 text-xs text-ink-3">
              <Orbit size="sm" />
              Watching for claude in your PATH…
              <Button variant="quiet" size="xs" className="ml-auto">
                Other ways to install
              </Button>
            </div>
          </div>
        )}
      </div>

      {install.state === "ready" && (
        <p className="m-0 flex items-start gap-2 text-xs leading-[18px] text-ink-4">
          <InfoCircle width={13} height={13} strokeWidth={2} className="mt-0.5 shrink-0" />
          Use a work and a personal account side by side. Each task picks one, and Nex shows the
          limits of all of them.
        </p>
      )}
    </OnboardingStep>
  );
}
