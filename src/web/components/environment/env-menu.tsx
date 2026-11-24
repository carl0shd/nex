import { useState } from "react";
import {
  AppWindow,
  ChevronDown,
  Copy,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  Terminal,
} from "lucide-react";
import { IconButton } from "@/components/atoms/icon-button";
import { StatusDot, type DotTone } from "@/components/atoms/status-dot";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/primitives/menu";
import { EnvButton, type EnvState } from "@/components/task/env-button";
import { cn } from "@/lib/utils";

export type ServiceState = "up" | "starting" | "down" | "paused";

export interface ServiceAddress {
  label: string;
  url: string;
}

export interface TaskService {
  name: string;
  detail: string;
  warning?: string;
  url?: string;
  addresses?: ServiceAddress[];
  state: ServiceState;
}

const SERVICE_DOT: Record<ServiceState, DotTone> = {
  up: "green",
  starting: "orange",
  down: "red",
  paused: "idle",
};

function OpenWithMenu({
  name,
  addresses,
  onOpen,
  onCopy,
}: {
  name: string;
  addresses: readonly ServiceAddress[];
  onOpen: (url: string) => void;
  onCopy?: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pick = (action: () => void) => () => {
    setOpen(false);
    action();
  };
  const first = addresses[0];
  return (
    <AnchoredPopover
      open={open}
      onOpenChange={setOpen}
      side="bottom"
      align="end"
      className="mr-1"
      trigger={
        <IconButton
          size="sm"
          pressed={open}
          className="size-6 rounded-control focus-visible:outline-offset-0"
          aria-label={`Ways to open ${name}`}
          onClick={() => setOpen(!open)}
        >
          <ChevronDown
            width={13}
            height={13}
            strokeWidth={2}
            className={cn("transition-transform duration-150 ease-out", open && "rotate-180")}
          />
        </IconButton>
      }
    >
      <Menu width={260}>
        <MenuLabel>Open with</MenuLabel>
        {addresses.map((address) => (
          <MenuItem
            key={address.url}
            icon={ExternalLink}
            onSelect={pick(() => onOpen(address.url))}
          >
            {address.label}
          </MenuItem>
        ))}
        {onCopy && first && (
          <>
            <MenuSeparator />
            <MenuItem icon={Copy} onSelect={pick(() => onCopy(first.url))}>
              Copy link
            </MenuItem>
          </>
        )}
      </Menu>
    </AnchoredPopover>
  );
}

function ServiceRow({
  service,
  onOpen,
  onCopy,
}: {
  service: TaskService;
  onOpen?: (url: string) => void;
  onCopy?: (url: string) => void;
}) {
  const { url, addresses = [] } = service;
  return (
    <div data-menu-row className="relative flex w-full items-center rounded-control">
      <button
        type="button"
        onClick={() => url && onOpen?.(url)}
        className={cn(
          "interactive press-wide flex min-w-0 flex-1 items-center gap-2.5 rounded-control px-2.5 py-1.5 text-left select-none",
          url ? "cursor-pointer" : "cursor-default",
        )}
      >
        <StatusDot tone={SERVICE_DOT[service.state]} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-medium text-ink">{service.name}</span>
          <span title={service.detail} className="truncate text-3xs text-ink-4">
            {service.detail}
          </span>
          {service.warning && (
            <span className="truncate text-3xs text-orange">{service.warning}</span>
          )}
        </span>
        {url && (
          <ExternalLink width={11} height={11} strokeWidth={2} className="shrink-0 text-ink-4" />
        )}
      </button>
      {onOpen && addresses.length > 1 && (
        <OpenWithMenu name={service.name} addresses={addresses} onOpen={onOpen} onCopy={onCopy} />
      )}
    </div>
  );
}

export interface EnvMenuActions {
  onOpenService?: (url: string) => void;
  onCopyService?: (url: string) => void;
  onCopyLink?: () => void;
  onOpenWindow?: () => void;
  onRestart?: () => void;
  onTogglePause?: () => void;
  onLogs?: () => void;
}

export function EnvMenu({
  services,
  paused = false,
  actions = {},
  onClose,
}: {
  services: readonly TaskService[];
  paused?: boolean;
  actions?: EnvMenuActions;
  onClose?: () => void;
}) {
  const run = (action?: () => void) => () => {
    onClose?.();
    action?.();
  };
  return (
    <Menu width={300}>
      <MenuLabel>
        Environment · {services.length} {services.length === 1 ? "service" : "services"}
      </MenuLabel>
      {services.map((service) => (
        <ServiceRow
          key={service.name}
          service={service}
          onOpen={(url) => {
            onClose?.();
            actions.onOpenService?.(url);
          }}
          onCopy={
            actions.onCopyService &&
            ((url) => {
              onClose?.();
              actions.onCopyService?.(url);
            })
          }
        />
      ))}
      {(actions.onCopyLink || actions.onOpenWindow) && <MenuSeparator />}
      {actions.onCopyLink && (
        <MenuItem icon={Copy} onSelect={run(actions.onCopyLink)}>
          Copy link
        </MenuItem>
      )}
      {actions.onOpenWindow && (
        <MenuItem icon={AppWindow} onSelect={run(actions.onOpenWindow)}>
          Open in its own window
        </MenuItem>
      )}
      <MenuSeparator />
      <MenuItem icon={RotateCcw} onSelect={run(actions.onRestart)}>
        Restart environment
      </MenuItem>
      <MenuItem icon={paused ? Play : Pause} onSelect={run(actions.onTogglePause)}>
        {paused ? "Resume" : "Pause"}
      </MenuItem>
      <MenuItem icon={Terminal} onSelect={run(actions.onLogs)}>
        Logs in Shell
      </MenuItem>
    </Menu>
  );
}

export function EnvTaskButton({
  state,
  label,
  services,
  actions,
  defaultOpen = false,
}: {
  state: EnvState;
  label: string;
  services: readonly TaskService[];
  actions?: EnvMenuActions;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <AnchoredPopover
      open={open}
      onOpenChange={setOpen}
      side="bottom"
      align="end"
      trigger={<EnvButton state={state} label={label} open={open} onClick={() => setOpen(!open)} />}
    >
      <EnvMenu
        services={services}
        paused={state === "paused"}
        actions={actions}
        onClose={() => setOpen(false)}
      />
    </AnchoredPopover>
  );
}
