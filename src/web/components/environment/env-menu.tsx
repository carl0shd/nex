import { useState } from "react";
import { AppWindow, Copy, ExternalLink, Pause, Play, RotateCcw, Terminal } from "lucide-react";
import { StatusDot, type DotTone } from "@/components/atoms/status-dot";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/primitives/menu";
import { EnvButton, type EnvState } from "@/components/task/env-button";

export type ServiceState = "up" | "starting" | "down" | "paused";

export interface TaskService {
  name: string;
  detail: string;
  url?: string;
  state: ServiceState;
}

const SERVICE_DOT: Record<ServiceState, DotTone> = {
  up: "green",
  starting: "orange",
  down: "red",
  paused: "idle",
};

function ServiceRow({ service }: { service: TaskService }) {
  return (
    <button
      type="button"
      data-menu-row
      onClick={() => service.url && window.open(service.url, "_blank")}
      className="interactive press-wide relative flex w-full cursor-pointer items-center gap-2.5 rounded-control px-2.5 py-1.5 text-left select-none"
    >
      <StatusDot tone={SERVICE_DOT[service.state]} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-mono text-xs text-ink">{service.name}</span>
        <span className="truncate font-mono text-3xs text-ink-4">
          {service.url ?? service.detail}
        </span>
      </span>
      {service.url && (
        <ExternalLink width={11} height={11} strokeWidth={2} className="shrink-0 text-ink-4" />
      )}
    </button>
  );
}

export function EnvMenu({
  services,
  paused = false,
  onClose,
}: {
  services: readonly TaskService[];
  paused?: boolean;
  onClose?: () => void;
}) {
  const run = () => onClose?.();
  return (
    <Menu width={300}>
      <MenuLabel>Environment · {services.length} services</MenuLabel>
      {services.map((service) => (
        <ServiceRow key={service.name} service={service} />
      ))}
      <MenuSeparator />
      <MenuItem icon={Copy} onSelect={run}>
        Copy link
      </MenuItem>
      <MenuItem icon={AppWindow} onSelect={run}>
        Open in its own window
      </MenuItem>
      <MenuSeparator />
      <MenuItem icon={RotateCcw} onSelect={run}>
        Restart environment
      </MenuItem>
      <MenuItem icon={paused ? Play : Pause} onSelect={run}>
        {paused ? "Resume" : "Pause"}
      </MenuItem>
      <MenuItem icon={Terminal} onSelect={run}>
        Logs in Shell
      </MenuItem>
    </Menu>
  );
}

export function EnvTaskButton({
  state,
  label,
  services,
  defaultOpen = false,
}: {
  state: EnvState;
  label: string;
  services: readonly TaskService[];
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
      <EnvMenu services={services} paused={state === "paused"} onClose={() => setOpen(false)} />
    </AnchoredPopover>
  );
}
