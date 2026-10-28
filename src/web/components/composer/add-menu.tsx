import { useState, type ReactNode } from "react";
import {
  AtSign,
  Attachment,
  Folder,
  GridPlus,
  GridXmark,
  NavArrowRight,
  Plus,
  Search,
  Settings,
  SlashSquare,
} from "iconoir-react";
import { Button } from "@/components/atoms/button";
import { Kbd } from "@/components/atoms/kbd";
import { LogoTile } from "@/components/atoms/logo-tile";
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
}: {
  connector: Connector;
  query: string;
  onToggle: (id: string, enabled: boolean) => void;
  onRetry: (id: string) => void;
}) {
  const live = connector.enabled && !connector.failed;
  return (
    <div
      data-menu-row
      className="relative flex h-[34px] items-center gap-2.5 rounded-control px-2.5 select-none"
    >
      <LogoTile color={connector.logo.color} ink={connector.logo.ink}>
        {connector.logo.letter}
      </LogoTile>
      <span className="flex min-w-0 flex-col">
        <span className={cn("truncate text-sm", live ? "text-ink" : "text-ink-3")}>
          <HighlightedName name={connector.name} query={query} />
        </span>
        {connector.detail && !query && (
          <span className="text-3xs leading-3 text-ink-4">{connector.detail}</span>
        )}
      </span>
      <span className="ml-auto flex items-center gap-2">
        {connector.failed ? (
          <>
            <span className="flex items-center gap-[5px] text-2xs text-red">
              <span className="size-1.5 rounded-full bg-red" />
              Failed
            </span>
            <Button
              variant="ghost"
              size="xs"
              className="h-[22px] px-2"
              onClick={() => onRetry(connector.id)}
            >
              Retry
            </Button>
          </>
        ) : (
          <Switch
            size="sm"
            checked={connector.enabled}
            onChange={(enabled) => onToggle(connector.id, enabled)}
            label={connector.name}
          />
        )}
      </span>
    </div>
  );
}

export function ConnectorsMenu({
  groups,
  query,
  onQueryChange,
  onToggle,
  onRetry,
}: {
  groups: readonly ConnectorGroup[];
  query: string;
  onQueryChange: (query: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onRetry: (id: string) => void;
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
    />
  );
  return (
    <Menu width={330} origin="bottom left">
      <label className="mb-0.5 flex h-[34px] items-center gap-2 border-b border-line px-2.5 text-xs text-ink-4">
        <Search width={12} height={12} strokeWidth={2} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search connectors"
          className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-4"
        />
      </label>
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
      {!query && (
        <>
          <MenuSeparator />
          <MenuItem icon={Plus}>Add a server</MenuItem>
          <MenuItem icon={Settings} meta="Settings">
            Manage connectors
          </MenuItem>
        </>
      )}
    </Menu>
  );
}

export function AddMenu({
  connectorCount,
  connectorsOpen,
  onConnectorsOpenChange,
  children,
}: {
  connectorCount: number;
  connectorsOpen: boolean;
  onConnectorsOpenChange: (open: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div className="relative">
      <Menu width={250} origin="bottom left">
        <MenuItem icon={Attachment} meta={<Kbd>⌘U</Kbd>}>
          Add files or photos
        </MenuItem>
        <MenuItem icon={Folder}>Add folder</MenuItem>
        <MenuItem icon={AtSign} meta={<Kbd>@</Kbd>}>
          Mention a file
        </MenuItem>
        <MenuItem icon={SlashSquare} meta={<Kbd>/</Kbd>}>
          Commands
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          icon={GridPlus}
          active={connectorsOpen}
          onSelect={() => onConnectorsOpenChange(!connectorsOpen)}
          meta={
            <>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-green" />
                {connectorCount}
              </span>
              <NavArrowRight width={11} height={11} strokeWidth={2} />
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
      <GridXmark width={11} height={11} strokeWidth={2} />
      {count} connector{count === 1 ? "" : "s"} failed
    </ComposerPill>
  );
}
