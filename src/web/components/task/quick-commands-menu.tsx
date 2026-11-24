import { useState } from "react";
import { CornerDownLeft, Play, Search, Settings, Square, Terminal } from "lucide-react";
import { AgentLogo } from "@/components/atoms/agent-logo";
import { IconButton } from "@/components/atoms/icon-button";
import { StatusDot } from "@/components/atoms/status-dot";
import GlideMenu from "@/components/primitives/glide-menu";
import { MenuLabel, MenuSeparator } from "@/components/primitives/menu";
import { useNow } from "@/hooks/use-now";
import { searchItems } from "@/lib/command-search";
import { uptime } from "@/lib/uptime";
import { cn } from "@/lib/utils";

export interface QuickCommandEntry {
  name: string;
  command: string;
  running: boolean;
  port?: number | null;
  startedAt?: number;
}

export interface ClaudeCommandEntry {
  id: string;
  command: string;
  description: string;
  startedAt: number;
  kind?: "command" | "agent" | "workflow";
}

const KIND_LABEL = { agent: "Agent", workflow: "Workflow" } as const;

const UPTIME_TICK_MS = 30_000;

function Uptime({ since, now, className }: { since: number; now: number; className?: string }) {
  return (
    <span className={cn("shrink-0 text-2xs text-ink-4 tabular-nums", className)}>
      {uptime(since, now)}
    </span>
  );
}

function ClaudeCommandRow({
  command,
  now,
  onStop,
}: {
  command: ClaudeCommandEntry;
  now: number;
  onStop?: (id: string) => void;
}) {
  const kind = command.kind && command.kind !== "command" ? KIND_LABEL[command.kind] : null;
  return (
    <div
      title={command.command || command.description}
      data-menu-row={onStop ? true : undefined}
      className="relative flex h-8 items-center gap-2.5 rounded-control pr-1 pl-2.5"
    >
      <AgentLogo agent="claude" size={16} />
      {kind ? (
        <>
          <span className="truncate text-sm text-ink">{command.description}</span>
          <span className="min-w-0 flex-1 truncate text-2xs text-ink-4">{kind}</span>
        </>
      ) : command.description ? (
        <>
          <span className="truncate text-sm text-ink">{command.description}</span>
          <span className="min-w-0 flex-1 truncate font-mono text-2xs text-ink-4">
            {command.command}
          </span>
        </>
      ) : (
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">
          {command.command}
        </span>
      )}
      <Uptime since={command.startedAt} now={now} className={onStop ? undefined : "pr-1.5"} />
      {onStop && (
        <IconButton
          size="sm"
          aria-label="Stop"
          onClick={() => onStop(command.id)}
          className="size-6"
        >
          <Square width={10} height={10} strokeWidth={2.5} />
        </IconButton>
      )}
    </div>
  );
}

export function QuickCommandsMenu({
  commands,
  claudeCommands = [],
  onRun,
  onOpenTerminal,
  onStop,
  onStopClaude,
  onEdit,
}: {
  commands: readonly QuickCommandEntry[];
  claudeCommands?: readonly ClaudeCommandEntry[];
  onRun: (name: string) => void;
  onOpenTerminal: (name: string) => void;
  onStop: (name: string) => void;
  onStopClaude?: (id: string) => void;
  onEdit?: () => void;
}) {
  const [query, setQuery] = useState("");
  const now = useNow(UPTIME_TICK_MS);
  const found = searchItems(
    commands.map((command) => ({ ...command, label: command.name, keywords: [command.command] })),
    query,
  );
  const running = found.filter((command) => command.running);
  const idle = found.filter((command) => !command.running);
  const byClaude = searchItems(
    claudeCommands.map((command) => ({
      ...command,
      label: command.description || command.command,
      keywords: [command.command],
    })),
    query,
  );

  return (
    <div className="enter-pop flex w-[300px] flex-col rounded-menu bg-elevated p-1.5 shadow-overlay">
      <label className="mb-1 flex h-[34px] items-center gap-2 border-b border-line px-2.5 text-xs text-ink-4">
        <Search width={12} height={12} strokeWidth={2} />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && idle[0]) onRun(idle[0].name);
          }}
          placeholder="Run a command…"
          className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-4"
        />
      </label>
      <GlideMenu className="menu-scroll flex max-h-[320px] flex-col gap-0.5 overflow-y-auto">
        {running.length > 0 && <MenuLabel>Running</MenuLabel>}
        {running.map((command) => (
          <div
            key={command.name}
            data-menu-row
            className="relative flex h-8 items-center gap-2.5 rounded-control pr-1 pl-2.5"
          >
            <StatusDot tone="green" />
            <span title={command.name} className="truncate text-sm text-ink">
              {command.name}
            </span>
            {command.port != null && (
              <span className="shrink-0 text-2xs text-ink-3 tabular-nums">:{command.port}</span>
            )}
            {command.startedAt !== undefined && (
              <Uptime since={command.startedAt} now={now} className="ml-auto" />
            )}
            <span
              className={cn(
                "flex shrink-0 items-center",
                command.startedAt === undefined && "ml-auto",
              )}
            >
              <IconButton
                size="sm"
                aria-label="Open terminal"
                onClick={() => onOpenTerminal(command.name)}
                className="size-6"
              >
                <Terminal width={12} height={12} strokeWidth={2} />
              </IconButton>
              <IconButton
                size="sm"
                aria-label="Stop"
                onClick={() => onStop(command.name)}
                className="size-6"
              >
                <Square width={10} height={10} strokeWidth={2.5} />
              </IconButton>
            </span>
          </div>
        ))}
        {byClaude.length > 0 && <MenuLabel>Started by Claude</MenuLabel>}
        {byClaude.map((command) => (
          <ClaudeCommandRow key={command.id} command={command} now={now} onStop={onStopClaude} />
        ))}
        {idle.length > 0 && <MenuLabel>Commands</MenuLabel>}
        {idle.map((command) => (
          <button
            key={command.name}
            type="button"
            data-menu-row
            onClick={() => onRun(command.name)}
            className="interactive press-wide group/command relative flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-control px-2.5 text-left select-none"
          >
            <Play width={11} height={11} strokeWidth={2} className="shrink-0 text-ink-4" />
            <span className="truncate text-sm text-ink">{command.name}</span>
            <span className="ml-auto truncate font-mono text-2xs text-ink-4">
              {command.command}
            </span>
            <CornerDownLeft
              width={11}
              height={11}
              strokeWidth={2}
              className="-ml-2.5 w-0 shrink-0 text-ink-3 opacity-0 transition-[width,margin,opacity] duration-150 ease-out-strong group-hover/command:ml-0 group-hover/command:w-[11px] group-hover/command:opacity-100"
            />
          </button>
        ))}
        {found.length === 0 && byClaude.length === 0 && (
          <div className="flex h-8 items-center px-2.5 text-xs text-ink-4">No commands match</div>
        )}
      </GlideMenu>
      {onEdit && (
        <>
          <MenuSeparator />
          <button
            type="button"
            onClick={onEdit}
            className="interactive press-wide flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-control px-2.5 text-left text-sm text-ink-2 select-none hover:bg-hover hover:text-ink"
          >
            <Settings width={13} height={13} strokeWidth={2} className="text-ink-3" />
            Edit commands
          </button>
        </>
      )}
    </div>
  );
}
