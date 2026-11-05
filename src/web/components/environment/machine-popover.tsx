import { useState } from "react";
import { Globe, Pause, Settings } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { HoverSwap } from "@/components/atoms/hover-swap";
import { IconButton } from "@/components/atoms/icon-button";
import { Orbit } from "@/components/atoms/orbit";
import { StatusDot } from "@/components/atoms/status-dot";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import GlideMenu from "@/components/primitives/glide-menu";
import { MenuItem, MenuSeparator } from "@/components/primitives/menu";
import { cn } from "@/lib/utils";

export interface MachineEnvironment {
  id: string;
  title: string;
  project: string;
  detail: string;
  state: "running" | "starting" | "down" | "paused";
  gb?: number;
  pausedFor?: string;
  suggested?: boolean;
}

export interface MachineUsage {
  usedGb: number;
  totalGb: number;
  machineGb: number;
  idle: number;
  environments: readonly MachineEnvironment[];
}

const NEARLY_FULL = 0.85;

const gb = (value: number) => `${value.toFixed(1)} GB`;

function MemoryBar({ usage, width }: { usage: MachineUsage; width?: number }) {
  const ratio = usage.usedGb / usage.totalGb;
  return (
    <span className="block h-1 overflow-hidden rounded-full bg-hover-2" style={{ width }}>
      <span
        className={cn("block h-full rounded-full", ratio >= NEARLY_FULL ? "bg-orange" : "bg-green")}
        style={{ width: `${Math.min(ratio, 1) * 100}%` }}
      />
    </span>
  );
}

function EnvironmentRow({
  environment,
  onPause,
}: {
  environment: MachineEnvironment;
  onPause?: () => void;
}) {
  const paused = environment.state === "paused";
  return (
    <div data-menu-row className="relative flex h-10 items-center gap-2.5 rounded-control px-2.5">
      <span className="flex w-3.5 shrink-0 justify-center">
        {environment.state === "starting" ? (
          <Orbit size="sm" />
        ) : (
          <StatusDot tone={environment.state === "down" ? "red" : paused ? "idle" : "green"} />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("truncate text-sm", paused ? "text-ink-3" : "text-ink")}>
          {environment.title}
        </span>
        <span className="truncate text-3xs text-ink-4">
          {environment.detail
            ? `${environment.project} · ${environment.detail}`
            : environment.project}
        </span>
      </span>
      {paused ? (
        <span className="text-2xs text-ink-4">paused {environment.pausedFor}</span>
      ) : environment.suggested ? (
        <Button variant="inverse" size="xs" onClick={onPause}>
          Pause
        </Button>
      ) : (
        <HoverSwap
          rest={
            <span className="text-2xs text-ink-3 tabular-nums">
              {environment.gb !== undefined && gb(environment.gb)}
            </span>
          }
          hover={
            <IconButton
              aria-label={`Pause ${environment.title}`}
              size="sm"
              onClick={onPause}
              className="size-6 bg-hover-2"
            >
              <Pause width={11} height={11} strokeWidth={2.25} />
            </IconButton>
          }
        />
      )}
    </div>
  );
}

export function MachinePopover({
  usage,
  onPause,
  onPauseIdle,
  onSettings,
}: {
  usage: MachineUsage;
  onPause?: (id: string) => void;
  onPauseIdle?: () => void;
  onSettings?: () => void;
}) {
  const running = usage.environments.filter((environment) => environment.state !== "paused");
  const paused = usage.environments.filter((environment) => environment.state === "paused");
  const nearlyFull = usage.usedGb / usage.totalGb >= NEARLY_FULL;
  return (
    <div
      role="dialog"
      aria-label="Linux machine"
      className="enter-pop flex w-[310px] flex-col rounded-menu bg-elevated p-1.5 shadow-overlay"
      style={{ transformOrigin: "bottom left" }}
    >
      <div className="flex flex-col gap-2 px-2.5 pt-2 pb-2.5">
        <div className="flex items-center text-sm font-semibold text-ink">
          Linux machine
          <span
            className={cn(
              "ml-auto text-xs font-normal tabular-nums",
              nearlyFull ? "text-orange" : "text-ink-3",
            )}
          >
            {usage.usedGb} of {usage.totalGb} GB
          </span>
        </div>
        <MemoryBar usage={usage} />
        <span className="text-2xs text-ink-4">
          {gb(usage.machineGb)} of it is the machine itself
        </span>
        {nearlyFull && (
          <span className="rounded-control bg-orange-tint px-2.5 py-2 text-xs leading-[17px] text-orange">
            Almost full. A new environment waits until one pauses.
          </span>
        )}
      </div>
      <GlideMenu className="flex flex-col">
        <span className="px-2.5 pt-1 pb-1 text-3xs text-ink-4">Running · {running.length}</span>
        {running.map((environment) => (
          <EnvironmentRow
            key={environment.id}
            environment={environment}
            onPause={() => onPause?.(environment.id)}
          />
        ))}
        {paused.length > 0 && (
          <span className="px-2.5 pt-2 pb-1 text-3xs text-ink-4">Paused · {paused.length}</span>
        )}
        {paused.map((environment) => (
          <EnvironmentRow key={environment.id} environment={environment} />
        ))}
      </GlideMenu>
      <MenuSeparator />
      <MenuItem icon={Pause} meta={`${usage.idle} idle`} onSelect={onPauseIdle}>
        Pause idle environments
      </MenuItem>
      <MenuItem icon={Settings} onSelect={onSettings}>
        Environment settings
      </MenuItem>
    </div>
  );
}

export function EnvironmentsMeter({
  usage,
  defaultOpen = false,
  onPause,
}: {
  usage: MachineUsage;
  defaultOpen?: boolean;
  onPause?: (id: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const nearlyFull = usage.usedGb / usage.totalGb >= NEARLY_FULL;
  return (
    <AnchoredPopover
      open={open}
      onOpenChange={setOpen}
      side="right"
      trigger={
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className={cn(
            "interactive press-wide flex h-[30px] w-full cursor-pointer items-center gap-2 rounded-control px-2 text-xs font-medium select-none",
            open ? "bg-hover-2 text-ink" : "text-ink-2 hover:bg-hover",
          )}
        >
          <Globe width={13} height={13} strokeWidth={2} className="text-ink-3" />
          Environments
          <span className="ml-auto flex items-center gap-2">
            <MemoryBar usage={usage} width={36} />
            <span
              className={cn(
                "text-2xs font-normal tabular-nums",
                nearlyFull ? "text-orange" : "text-ink-3",
              )}
            >
              {usage.usedGb} / {usage.totalGb} GB
            </span>
          </span>
        </button>
      }
    >
      <MachinePopover
        usage={usage}
        onPause={(id) => {
          onPause?.(id);
          setOpen(false);
        }}
      />
    </AnchoredPopover>
  );
}
