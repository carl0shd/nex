import { useState } from "react";
import { Ellipsis, Folder, Lock, LogOut, PenLine, Star } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { InlineRename } from "@/components/atoms/inline-rename";
import { Monogram } from "@/components/atoms/entity-chip";
import { IconButton } from "@/components/atoms/icon-button";
import { Meter } from "@/components/atoms/meter";
import { ValuePill } from "@/components/atoms/value-pill";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Menu, MenuItem, MenuSeparator } from "@/components/primitives/menu";
import { ModalCard } from "@/components/primitives/modal-card";
import { usageTone } from "@/lib/usage";
import { cn } from "@/lib/utils";

export interface ClaudeAccount {
  id: string;
  name: string;
  email: string;
  color: string;
  usedPercent: number;
  isDefault?: boolean;
  expired?: boolean;
  tasks?: number;
}

function AccountMenu({
  account,
  onMakeDefault,
  onRename,
  onShowProfile,
  onRemove,
  onClose,
}: {
  account: ClaudeAccount;
  onMakeDefault: () => void;
  onRename?: () => void;
  onShowProfile?: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const run = (action?: () => void) => () => {
    action?.();
    onClose();
  };
  return (
    <Menu width={210}>
      {!account.isDefault && (
        <MenuItem icon={Star} onSelect={run(onMakeDefault)}>
          Make default
        </MenuItem>
      )}
      {onRename && (
        <MenuItem icon={PenLine} onSelect={run(onRename)}>
          Rename
        </MenuItem>
      )}
      {onShowProfile && (
        <MenuItem icon={Folder} onSelect={run(onShowProfile)}>
          Show profile in Finder
        </MenuItem>
      )}
      <MenuSeparator />
      <MenuItem icon={LogOut} danger onSelect={run(onRemove)}>
        Remove from Nex
      </MenuItem>
    </Menu>
  );
}

function AccountRow({
  account,
  menuOpen,
  onMenuOpenChange,
  onMakeDefault,
  onRename,
  onShowProfile,
  onRemove,
  onSignIn,
}: {
  account: ClaudeAccount;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onMakeDefault: () => void;
  onRename?: (name: string) => void;
  onShowProfile?: () => void;
  onRemove: () => void;
  onSignIn?: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3.5 py-3 transition-colors duration-150",
        menuOpen ? "bg-hover" : "hover:bg-hover/50",
      )}
    >
      <Monogram size="lg" color={account.color}>
        {account.name[0]}
      </Monogram>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
          {renaming ? (
            <InlineRename
              label="Account name"
              name={account.name}
              className="-ml-1.5 h-5 max-w-[240px] flex-none rounded-[5px] text-sm leading-5 font-medium [field-sizing:content]"
              onDone={(next) => {
                setRenaming(false);
                if (next) onRename?.(next);
              }}
            />
          ) : (
            <span className="truncate" title={account.name}>
              {account.name}
            </span>
          )}
          {account.isDefault && <ValuePill tone="accent">Default</ValuePill>}
        </span>
        <span className="truncate text-xs text-ink-4">
          {account.email}
          {account.expired && <span className="text-orange"> · login expired</span>}
        </span>
      </span>
      {account.expired ? (
        <Button size="sm" onClick={onSignIn}>
          Sign in again
        </Button>
      ) : (
        <Meter value={account.usedPercent} tone={usageTone(account.usedPercent)} />
      )}
      <AnchoredPopover
        open={menuOpen}
        onOpenChange={onMenuOpenChange}
        side="bottom"
        align="end"
        strategy="fixed"
        trigger={
          <IconButton
            aria-label="Account actions"
            aria-expanded={menuOpen}
            size="sm"
            pressed={menuOpen}
            onClick={() => onMenuOpenChange(!menuOpen)}
          >
            <Ellipsis width={14} height={14} strokeWidth={2} />
          </IconButton>
        }
      >
        <AccountMenu
          account={account}
          onMakeDefault={onMakeDefault}
          onRename={onRename && (() => setRenaming(true))}
          onShowProfile={onShowProfile}
          onRemove={onRemove}
          onClose={() => onMenuOpenChange(false)}
        />
      </AnchoredPopover>
    </div>
  );
}

export function AccountList({
  accounts,
  defaultMenuOpen,
  onMakeDefault,
  onRename,
  onShowProfile,
  onRemove,
  onSignIn,
}: {
  accounts: readonly ClaudeAccount[];
  defaultMenuOpen?: string;
  onMakeDefault: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onShowProfile?: (id: string) => void;
  onRemove: (id: string) => void;
  onSignIn?: (id: string) => void;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(defaultMenuOpen ?? null);
  return (
    <>
      {accounts.map((account) => (
        <AccountRow
          key={account.id}
          account={account}
          menuOpen={openMenu === account.id}
          onMenuOpenChange={(open) => setOpenMenu(open ? account.id : null)}
          onMakeDefault={() => onMakeDefault(account.id)}
          onRename={onRename && ((name) => onRename(account.id, name))}
          onShowProfile={onShowProfile && (() => onShowProfile(account.id))}
          onRemove={() => onRemove(account.id)}
          onSignIn={() => onSignIn?.(account.id)}
        />
      ))}
    </>
  );
}

export function RemoveAccountDialog({
  account,
  fallback,
  onCancel,
  onConfirm,
}: {
  account: ClaudeAccount;
  fallback?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const tasks = account.tasks ?? 0;
  const description =
    tasks > 0
      ? `${tasks} ${tasks === 1 ? "task uses" : "tasks use"} this account. They switch to ${fallback ?? "your default account"} the next time they start.`
      : "No task uses this account.";
  return (
    <ModalCard
      title={`Remove ${account.name}?`}
      icon={
        <Monogram size="lg" color={account.color} className="size-8">
          {account.name[0]}
        </Monogram>
      }
      onClose={onCancel}
      footer={
        <>
          <span className="ml-auto" />
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>
            Remove
          </Button>
        </>
      }
    >
      <p className="m-0 text-sm leading-[19px] text-ink-3">{description}</p>
      <p className="m-0 mt-3.5 flex items-start gap-2 text-xs leading-[18px] text-ink-4">
        <Lock width={13} height={13} strokeWidth={2} className="mt-0.5 shrink-0" />
        Nex only forgets this account. Your claude.ai account and its Claude Code login are not
        touched.
      </p>
    </ModalCard>
  );
}
