import { useState, type ReactNode } from "react";
import {
  AtSign,
  ChevronRight,
  Grid2x2Plus,
  Grid2x2X,
  Paperclip,
  PowerOff,
  Search,
  SquareSlash,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/atoms/button";
import { HoverSwap } from "@/components/atoms/hover-swap";
import { IconButton } from "@/components/atoms/icon-button";
import { Kbd } from "@/components/atoms/kbd";
import { LogoTile } from "@/components/atoms/logo-tile";
import { Spinner } from "@/components/atoms/spinner";
import { Switch } from "@/components/atoms/switch";
import { ComposerPill } from "@/components/composer/composer-pill";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/primitives/menu";
import { cn } from "@/lib/utils";

export interface Connector {
  id: string;
  name: string;
  logo: { letter: string; color?: string; ink?: string };
  detail?: string;
  enabled: boolean;
  failed?: boolean;
  needsSignIn?: boolean;
  removable?: boolean;
  busy?: boolean;
}

export interface ConnectorGroup {
  id: string;
  label: string;
  source?: string;
  connectors: Connector[];
  visible?: number;
}

function HighlightedName({ name, query }: { name: string; query: string }) {
  const start = query ? name.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (start < 0) return name;
  return (
    <>
      {name.slice(0, start)}
      <span className="text-accent-ink">{name.slice(start, start + query.length)}</span>
      {name.slice(start + query.length)}
    </>
  );
}

function ConnectorRow({
  connector,
  query,
  onToggle,
  onRetry,
  onRemove,
}: {
  connector: Connector;
  query: string;
  onToggle: (id: string, enabled: boolean) => void;
  onRetry: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const live = connector.enabled && !connector.failed;
  const identity = (
    <>
      <LogoTile color={connector.logo.color} ink={connector.logo.ink}>
        {connector.logo.letter}
      </LogoTile>
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className={cn("truncate text-sm", live ? "text-ink" : "text-ink-3")}>
          <HighlightedName name={connector.name} query={query} />
        </span>
        {connector.detail && !query && (
          <span title={connector.detail} className="truncate text-3xs leading-3 text-ink-4">
            {connector.detail}
          </span>
        )}
      </span>
    </>
  );
  const rowClass =
    "relative flex h-[38px] w-full min-w-0 shrink-0 items-center gap-2.5 rounded-control px-2.5 select-none";

  const failedLabel = (
    <span className="flex items-center gap-[5px] text-2xs text-red">
      <span className="size-1.5 rounded-full bg-red" />
      Failed
    </span>
  );

  if (connector.failed && !connector.busy) {
    return (
      <div data-menu-row className={rowClass}>
        {identity}
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {onRemove ? (
            <HoverSwap
              rest={failedLabel}
              hover={
                <IconButton
                  size="sm"
                  aria-label={connector.removable ? "Remove" : "Turn off"}
                  title={connector.removable ? "Remove" : "Turn off"}
                  className="size-[22px] hover:text-red"
                  onClick={() => onRemove(connector.id)}
                >
                  {connector.removable ? (
                    <Trash2 width={12} height={12} strokeWidth={2} />
                  ) : (
                    <PowerOff width={12} height={12} strokeWidth={2} />
                  )}
                </IconButton>
              }
            />
          ) : (
            failedLabel
          )}
          <Button
            variant="ghost"
            size="xs"
            className="h-[22px] px-2"
            onClick={() => onRetry(connector.id)}
          >
            {connector.needsSignIn ? "Sign in" : "Retry"}
          </Button>
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      data-menu-row
      role="switch"
      aria-checked={connector.enabled}
      aria-label={connector.name}
      aria-busy={connector.busy}
      disabled={connector.busy}
      onClick={() => onToggle(connector.id, !connector.enabled)}
      className={cn(rowClass, "interactive press-wide cursor-pointer disabled:cursor-default")}
    >
      {identity}
      <span className="ml-auto flex h-4 w-7 shrink-0 items-center justify-center">
        {connector.busy ? (
          <Spinner className="size-3.5" />
        ) : (
          <Switch size="sm" checked={connector.enabled} display />
        )}
      </span>
    </button>
  );
}

export function ConnectorsMenu({
  groups,
  query,
  onQueryChange,
  onToggle,
  onRetry,
  onRemove,
}: {
  groups: readonly ConnectorGroup[];
  query: string;
  onQueryChange: (query: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onRetry: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const matches = groups
    .flatMap((group) => group.connectors)
    .filter((connector) => connector.name.toLowerCase().includes(query.toLowerCase()));
  const row = (connector: Connector) => (
    <ConnectorRow
      key={connector.id}
      connector={connector}
      query={query}
      onToggle={onToggle}
      onRetry={onRetry}
      onRemove={onRemove}
    />
  );
  return (
    <Menu
      width={330}
      origin="bottom left"
      maxHeight={340}
      header={
        <label className="mb-1 flex h-[34px] shrink-0 items-center gap-2 border-b border-line px-2.5 text-xs text-ink-4">
          <Search width={12} height={12} strokeWidth={2} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search connectors"
            className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-4"
          />
        </label>
      }
    >
      {query
        ? matches.map(row)
        : groups.map((group) => {
            const limit = expanded.includes(group.id) ? undefined : group.visible;
            const hidden = group.connectors.length - (limit ?? group.connectors.length);
            return (
              <div key={group.id} className="flex flex-col gap-0.5">
                <MenuLabel className="h-[26px]" trailing={group.source}>
                  {group.label}
                </MenuLabel>
                {group.connectors.slice(0, limit).map(row)}
                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((ids) => [...ids, group.id])}
                    className="interactive flex h-[26px] cursor-pointer items-center px-2.5 text-2xs text-ink-4 select-none hover:text-ink-2"
                  >
                    + {hidden} more
                  </button>
                )}
              </div>
            );
          })}
      {query && matches.length === 0 && (
        <div className="flex h-[34px] items-center px-2.5 text-xs text-ink-4">
          No connectors match
        </div>
      )}
    </Menu>
  );
}

export function AddMenu({
  connectorCount,
  connectorsOpen,
  onConnectorsOpenChange,
  onAddFiles,
  onMention,
  onCommands,
  children,
}: {
  connectorCount: number;
  connectorsOpen: boolean;
  onConnectorsOpenChange: (open: boolean) => void;
  onAddFiles?: () => void;
  onMention?: () => void;
  onCommands?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="relative">
      <Menu width={250} origin="bottom left">
        <MenuItem icon={Paperclip} meta={<Kbd>⌘U</Kbd>} onSelect={onAddFiles}>
          Add files or photos
        </MenuItem>
        <MenuItem icon={AtSign} meta={<Kbd>@</Kbd>} onSelect={onMention}>
          Mention a file
        </MenuItem>
        <MenuItem icon={SquareSlash} meta={<Kbd>/</Kbd>} onSelect={onCommands}>
          Commands
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          icon={Grid2x2Plus}
          active={connectorsOpen}
          onSelect={() => onConnectorsOpenChange(!connectorsOpen)}
          meta={
            <>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-green" />
                {connectorCount}
              </span>
              <ChevronRight width={11} height={11} strokeWidth={2} />
            </>
          }
        >
          Connectors
        </MenuItem>
      </Menu>
      {connectorsOpen && <div className="absolute bottom-0 left-full ml-1.5">{children}</div>}
    </div>
  );
}

export function ConnectorAlert({ count, onClick }: { count: number; onClick?: () => void }) {
  return (
    <ComposerPill
      onClick={onClick}
      className="text-red shadow-[0_0_0_1px_color-mix(in_srgb,var(--red)_35%,transparent)] hover:bg-red-tint"
    >
      <Grid2x2X width={11} height={11} strokeWidth={2} />
      {count} connector{count === 1 ? "" : "s"} failed
    </ComposerPill>
  );
}
