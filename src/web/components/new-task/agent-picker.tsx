import { Check } from "lucide-react";
import { AgentLogo, type AgentKind } from "@/components/atoms/agent-logo";
import GlideMenu from "@/components/primitives/glide-menu";
import { MenuLabel, MenuSeparator } from "@/components/primitives/menu";
import { cn } from "@/lib/utils";

export interface AgentAccount {
  id: string;
  name: string;
  plan?: string;
  color?: string;
  usedPercent?: number;
}

export interface AgentOption {
  id: AgentKind;
  name: string;
  shortName?: string;
  detail: string;
  installed: boolean;
  accounts?: AgentAccount[];
}

export type AgentChoice = { agent: AgentKind; account?: string };

function AgentRow({
  option,
  selected,
  onSelect,
  onInstall,
}: {
  option: AgentOption;
  selected: boolean;
  onSelect: () => void;
  onInstall?: () => void;
}) {
  return (
    <div
      role="option"
      aria-selected={selected}
      aria-disabled={!option.installed}
      data-menu-row
      onClick={option.installed ? onSelect : undefined}
      className={cn(
        "interactive relative flex h-11 items-center gap-2.5 rounded-[9px] px-2.5 select-none",
        option.installed ? "press-wide cursor-pointer" : "opacity-55",
        selected && "bg-hover group-hover/glide-menu:bg-transparent",
      )}
    >
      <AgentLogo agent={option.id} />
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-sm font-medium text-ink">{option.name}</span>
        {option.detail && <span className="truncate text-2xs text-ink-4">{option.detail}</span>}
      </span>
      {selected && (
        <Check width={13} height={13} strokeWidth={2.5} className="shrink-0 text-accent-ink" />
      )}
      {!option.installed && (
        <button
          type="button"
          onClick={onInstall}
          className="interactive press cursor-pointer rounded-full px-2 py-[3px] text-2xs text-ink-3 shadow-[inset_0_0_0_1px_var(--line-strong)] select-none hover:bg-hover hover:text-ink"
        >
          Install
        </button>
      )}
    </div>
  );
}

function AccountRow({
  account,
  selected,
  onSelect,
}: {
  account: AgentAccount;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      role="option"
      aria-selected={selected}
      data-menu-row
      onClick={onSelect}
      className="interactive press-wide relative flex h-8 cursor-pointer items-center gap-[9px] rounded-control pr-2.5 pl-[46px] text-xs select-none"
    >
      <span
        className="size-1.5 rounded-[2px] bg-accent"
        style={account.color ? { background: account.color } : undefined}
      />
      <span className={cn("truncate", selected ? "text-ink" : "text-ink-3")}>{account.name}</span>
      {account.plan && <span className="text-ink-4">{account.plan}</span>}
      {account.usedPercent !== undefined && (
        <span className="ml-auto text-2xs text-ink-4 tabular-nums">
          {account.usedPercent}% used
        </span>
      )}
    </div>
  );
}

export function AgentPicker({
  agents,
  value,
  onChange,
  onInstall,
}: {
  agents: readonly AgentOption[];
  value: AgentChoice;
  onChange: (choice: AgentChoice) => void;
  onInstall?: (agent: AgentKind) => void;
}) {
  const withAccounts = agents.filter((option) => option.accounts?.length);
  const others = agents.filter((option) => !option.accounts?.length);
  return (
    <div
      role="listbox"
      aria-label="Agent"
      className="enter-pop w-[300px] rounded-menu bg-elevated p-1.5 shadow-overlay"
      style={{ transformOrigin: "top left" }}
    >
      <MenuLabel className="h-[26px]">Agent</MenuLabel>
      <GlideMenu highlightClassName="inset-x-0 rounded-[9px] bg-hover">
        {withAccounts.map((option) => (
          <div key={option.id}>
            <AgentRow
              option={option}
              selected={value.agent === option.id}
              onSelect={() => onChange({ agent: option.id, account: option.accounts?.[0]?.id })}
            />
            {option.accounts?.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                selected={value.agent === option.id && value.account === account.id}
                onSelect={() => onChange({ agent: option.id, account: account.id })}
              />
            ))}
          </div>
        ))}
        {withAccounts.length > 0 && others.length > 0 && <MenuSeparator />}
        {others.map((option) => (
          <AgentRow
            key={option.id}
            option={option}
            selected={value.agent === option.id}
            onSelect={() => onChange({ agent: option.id })}
            onInstall={() => onInstall?.(option.id)}
          />
        ))}
      </GlideMenu>
    </div>
  );
}
