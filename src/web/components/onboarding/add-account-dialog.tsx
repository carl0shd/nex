import { useState, type ReactNode } from "react";
import { Check, Copy, Lock, OpenNewWindow, WarningCircle, Xmark } from "iconoir-react";
import { ClaudeTile } from "@/components/atoms/agent-tile";
import { Button } from "@/components/atoms/button";
import { ColorSwatches, type Swatch } from "@/components/atoms/color-swatches";
import { Monogram } from "@/components/atoms/entity-chip";
import { Orbit } from "@/components/atoms/orbit";
import { Switch } from "@/components/atoms/switch";
import { TextField } from "@/components/atoms/text-field";
import { ValuePill } from "@/components/atoms/value-pill";
import { ModalCard, StatusIcon } from "@/components/primitives/modal-card";

export interface SignedInAccount {
  name: string;
  email: string;
  color: string;
}

export type AddAccountStage =
  | { stage: "intro" }
  | { stage: "waiting" }
  | { stage: "signed-in"; account: SignedInAccount }
  | { stage: "exists"; account: SignedInAccount }
  | { stage: "failed" }
  | { stage: "expired"; account: SignedInAccount; pausedTasks: number };

const ACCOUNT_COLORS: readonly Swatch[] = [
  { name: "Green", color: "#33843F" },
  { name: "Purple", color: "#6b21a8" },
  { name: "Blue", color: "#3f6fb5" },
  { name: "Amber", color: "#b07a1f" },
  { name: "Red", color: "#c4513d" },
  { name: "Gray", color: "#52544f" },
];

function AccountCard({ account, trailing }: { account: SignedInAccount; trailing?: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-field bg-hover px-3 py-2.5">
      <Monogram size="md" color={account.color}>
        {account.name[0]}
      </Monogram>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-ink">{account.name}</span>
        <span className="truncate font-mono text-2xs text-ink-4">{account.email}</span>
      </span>
      {trailing}
    </div>
  );
}

function PrivacyNote({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 flex items-start gap-2 text-xs leading-[18px] text-ink-4">
      <Lock width={13} height={13} strokeWidth={2} className="mt-0.5 shrink-0" />
      {children}
    </p>
  );
}

function LinkActions({ onOpenAgain }: { onOpenAgain?: () => void }) {
  return (
    <div className="flex gap-1">
      {onOpenAgain && (
        <Button variant="quiet" size="sm" onClick={onOpenAgain}>
          <OpenNewWindow width={12} height={12} strokeWidth={2} />
          Open again
        </Button>
      )}
      <Button variant="quiet" size="sm">
        <Copy width={12} height={12} strokeWidth={2} />
        Copy link
      </Button>
    </div>
  );
}

function SignedInDialog({
  account,
  onAdd,
  onClose,
}: {
  account: SignedInAccount;
  onAdd?: (account: SignedInAccount & { isDefault: boolean }) => void;
  onClose?: () => void;
}) {
  const [name, setName] = useState(account.name.split(" ")[0]);
  const [color, setColor] = useState(account.color);
  const [isDefault, setIsDefault] = useState(false);
  return (
    <ModalCard
      title="Signed in"
      description="Name it the way you will look for it."
      icon={<StatusIcon tone="green" icon={Check} />}
      onClose={onClose}
      footer={
        <Button
          variant="primary"
          kbd="⌘↵"
          className="ml-auto"
          onClick={() => onAdd?.({ ...account, name, color, isDefault })}
        >
          Add account
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <AccountCard
          account={{ ...account, color }}
          trailing={<ValuePill tone="accent">Connected</ValuePill>}
        />
        <TextField
          label="Name in Nex"
          value={name}
          onChange={(event) => setName(event.target.value)}
          size="md"
        />
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-ink-3">Color</span>
          <ColorSwatches
            value={color}
            onChange={setColor}
            swatches={ACCOUNT_COLORS}
            shape="square"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="flex flex-1 flex-col">
            <span className="text-sm font-medium text-ink">Use for new tasks</span>
            <span className="text-xs text-ink-3">Makes it the default account.</span>
          </span>
          <Switch checked={isDefault} onChange={setIsDefault} />
        </div>
      </div>
    </ModalCard>
  );
}

export function AddAccountDialog({
  state,
  onContinue,
  onOpenAgain,
  onRetry,
  onAdd,
  onClose,
}: {
  state: AddAccountStage;
  onContinue?: () => void;
  onOpenAgain?: () => void;
  onRetry?: () => void;
  onAdd?: (account: SignedInAccount & { isDefault: boolean }) => void;
  onClose?: () => void;
}) {
  const claude = <ClaudeTile size={22} className="mt-px" />;
  const cancel = <Button onClick={onClose}>Cancel</Button>;

  switch (state.stage) {
    case "intro":
      return (
        <ModalCard
          title="Add a Claude account"
          description="Sign in once and pick it per task."
          icon={claude}
          onClose={onClose}
          footer={
            <>
              <span className="ml-auto" />
              {cancel}
              <Button variant="primary" onClick={onContinue}>
                Continue in browser
                <OpenNewWindow width={12} height={12} strokeWidth={2} />
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="m-0 text-sm leading-[19px] text-ink-2">
              You sign in on claude.ai with your Pro, Max, Team or Enterprise account.
            </p>
            <PrivacyNote>
              Nex signs in through Claude Code in a separate profile, so each account keeps its own
              login and limits.
            </PrivacyNote>
          </div>
        </ModalCard>
      );
    case "waiting":
      return (
        <ModalCard
          title="Add a Claude account"
          icon={claude}
          onClose={onClose}
          footer={
            <>
              <span className="ml-auto" />
              {cancel}
            </>
          }
        >
          <div className="flex flex-col items-center py-4 text-center">
            <span className="flex size-14 items-center justify-center">
              <Orbit size="lg" />
            </span>
            <span className="mt-3.5 text-base font-medium text-ink">
              Finish signing in in your browser
            </span>
            <span className="mt-1 max-w-[320px] text-sm leading-[19px] text-ink-3">
              We opened claude.ai. Nex picks it up as soon as you approve.
            </span>
            <div className="mt-4">
              <LinkActions onOpenAgain={onOpenAgain} />
            </div>
          </div>
        </ModalCard>
      );
    case "signed-in":
      return <SignedInDialog account={state.account} onAdd={onAdd} onClose={onClose} />;
    case "exists":
      return (
        <ModalCard
          title="This account is already in Nex"
          icon={<StatusIcon tone="orange" icon={WarningCircle} />}
          onClose={onClose}
          footer={
            <>
              <span className="ml-auto" />
              <Button onClick={onClose}>Close</Button>
              <Button variant="primary" onClick={onRetry}>
                Try another account
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3.5">
            <AccountCard account={state.account} />
            <p className="m-0 text-sm leading-[19px] text-ink-2">
              To add a different one, sign out of claude.ai in your browser first, then try again.
            </p>
          </div>
        </ModalCard>
      );
    case "failed":
      return (
        <ModalCard
          title="Sign-in didn’t finish"
          icon={<StatusIcon tone="red" icon={Xmark} />}
          onClose={onClose}
          footer={
            <>
              <LinkActions />
              <span className="ml-auto" />
              {cancel}
              <Button variant="primary" onClick={onRetry}>
                Try again
              </Button>
            </>
          }
        >
          <p className="m-0 text-sm leading-[19px] text-ink-2">
            The browser tab was closed or took longer than 5 minutes. Nothing was added.
          </p>
        </ModalCard>
      );
    case "expired":
      return (
        <ModalCard
          title={`Sign in to ${state.account.name} again`}
          icon={claude}
          onClose={onClose}
          footer={
            <>
              <span className="ml-auto" />
              <Button onClick={onClose}>Later</Button>
              <Button variant="primary" onClick={onContinue}>
                Continue in browser
                <OpenNewWindow width={12} height={12} strokeWidth={2} />
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="m-0 text-sm leading-[19px] text-ink-2">
              Claude Code says this account’s login expired. Its tasks are paused until you sign in.
            </p>
            <AccountCard
              account={state.account}
              trailing={
                state.pausedTasks > 0 && (
                  <ValuePill tone="orange">{state.pausedTasks} tasks paused</ValuePill>
                )
              }
            />
            <PrivacyNote>
              We fill in the email on the sign-in page so you land on the right account.
            </PrivacyNote>
          </div>
        </ModalCard>
      );
  }
}
