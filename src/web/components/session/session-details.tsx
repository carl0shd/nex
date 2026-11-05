import { useState, type ReactNode } from "react";
import {
  Copy,
  DollarSign,
  ExternalLink,
  Globe,
  Plug,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { ClaudeTile } from "@/components/atoms/agent-tile";
import { Kbd } from "@/components/atoms/kbd";
import { LogoTile } from "@/components/atoms/logo-tile";
import { Meter } from "@/components/atoms/meter";
import { StatusDot } from "@/components/atoms/status-dot";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { SessionChip } from "@/components/session/session-chip";
import {
  PopoverAction,
  PopoverRow,
  PopoverSeparator,
  SessionPopover,
} from "@/components/session/session-popover";
import { SessionStrip } from "@/components/session/session-strip";
import { cn } from "@/lib/utils";

export interface EnvironmentService {
  name: string;
  detail: string;
  url?: string;
}

export interface SessionEnvironment {
  host: string;
  services: EnvironmentService[];
  memory: string;
}

export interface SessionInfo {
  account: string;
  email: string;
  plan: string;
  mode: string;
  model: string;
  cost: string;
  startedAgo: string;
  sessionId: string;
}

export interface SessionContext {
  used: number;
  total: number;
  parts: { label: string; tokens: number }[];
  compactAt: number;
}

export type ConnectorState = "in-use" | "connected" | "sign-in" | "reconnect";

export interface SessionConnector {
  name: string;
  letter: string;
  state: ConnectorState;
}

const thousands = (tokens: number) => `${Math.round(tokens / 1000)}k`;

const CONNECTOR_STATE: Record<ConnectorState, { label?: string; tone: string }> = {
  "in-use": { label: "In use", tone: "text-accent-ink" },
  connected: { tone: "" },
  "sign-in": { label: "Sign in", tone: "text-orange" },
  reconnect: { label: "Reconnect", tone: "text-orange" },
};

function Mono({ name, detail }: { name: string; detail: string }) {
  return (
    <>
      {name} <span className="text-ink-4">{detail}</span>
    </>
  );
}

export function EnvironmentPopover({ environment }: { environment: SessionEnvironment }) {
  return (
    <SessionPopover
      title="Environment"
      meta={`${environment.services.length} services · ${environment.memory}`}
    >
      {environment.services.map((service) => (
        <PopoverRow
          key={service.name}
          leading={<StatusDot tone="green" />}
          label={<Mono name={service.name} detail={service.detail} />}
          trailing={
            service.url && (
              <ExternalLink width={12} height={12} strokeWidth={2} className="text-ink-4" />
            )
          }
          mono
        />
      ))}
      <PopoverSeparator />
      <PopoverAction icon={Globe} label="Open in the panel" />
      <PopoverAction icon={RotateCcw} label="Restart environment" />
      <PopoverAction icon={Terminal} label="Logs in Shell" />
    </SessionPopover>
  );
}

export function SessionInfoPopover({ session }: { session: SessionInfo }) {
  return (
    <SessionPopover title="Session" meta={`started ${session.startedAgo}`}>
      <PopoverRow
        leading={<ClaudeTile size={16} />}
        label={`${session.account} · ${session.email}`}
        trailing={<span className="text-xs text-ink-4">{session.plan}</span>}
      />
      <PopoverRow
        leading={<ShieldCheck width={13} height={13} strokeWidth={2} />}
        label={session.mode}
        trailing={<Kbd>⇧⇥</Kbd>}
      />
      <PopoverRow
        leading={<Sparkles width={13} height={13} strokeWidth={2} />}
        label={session.model}
      />
      <PopoverRow
        leading={<DollarSign width={13} height={13} strokeWidth={2} />}
        label="This task"
        trailing={<span className="text-xs text-ink-4">{session.cost}</span>}
      />
      <PopoverSeparator />
      <PopoverAction icon={Copy} label="Copy session ID" meta={session.sessionId} />
    </SessionPopover>
  );
}

function ContextBar({ label, tokens, total }: { label: string; tokens: number; total: number }) {
  return (
    <div className="flex flex-col gap-1.5 py-1">
      <div className="flex items-center text-xs text-ink-2">
        {label}
        <span className="ml-auto text-ink-4 tabular-nums">{thousands(tokens)}</span>
      </div>
      <span className="h-[3px] overflow-hidden rounded-full bg-line-strong">
        <span
          className="block h-full rounded-full bg-blue"
          style={{ width: `${Math.min((tokens / total) * 100, 100)}%` }}
        />
      </span>
    </div>
  );
}

export function ContextPopover({ context }: { context: SessionContext }) {
  return (
    <SessionPopover
      title="Context"
      meta={`${thousands(context.used)} of ${thousands(context.total)}`}
    >
      {context.parts.map((part) => (
        <ContextBar key={part.label} label={part.label} tokens={part.tokens} total={context.used} />
      ))}
      <PopoverSeparator />
      <PopoverAction icon={RotateCcw} label="Compact now" meta={`auto at ${context.compactAt}%`} />
    </SessionPopover>
  );
}

export function ConnectorsPopover({
  connectors,
  connectedCount,
}: {
  connectors: SessionConnector[];
  connectedCount: number;
}) {
  return (
    <SessionPopover title="Connectors" meta={`${connectedCount} connected`}>
      {connectors.map((connector) => {
        const state = CONNECTOR_STATE[connector.state];
        return (
          <PopoverRow
            key={connector.name}
            leading={
              connector.state === "in-use" ? (
                <LogoTile size="md" className="bg-green-tint text-accent-ink">
                  <Globe width={11} height={11} strokeWidth={2} />
                </LogoTile>
              ) : (
                <LogoTile size="md" className="bg-transparent">
                  {connector.letter}
                </LogoTile>
              )
            }
            label={connector.name}
            trailing={
              state.label && <span className={cn("text-xs", state.tone)}>{state.label}</span>
            }
          />
        );
      })}
      <PopoverSeparator />
      <PopoverAction icon={Settings} label="Manage connectors" />
    </SessionPopover>
  );
}

type StripChip = "environment" | "session" | "context" | "connectors";

function ChipPopover({
  open,
  onOpenChange,
  chip,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chip: ReactNode;
  children: ReactNode;
}) {
  return (
    <AnchoredPopover open={open} onOpenChange={onOpenChange} side="bottom" trigger={chip}>
      {children}
    </AnchoredPopover>
  );
}

export function TaskSessionStrip({
  environment,
  session,
  context,
  connectors,
  connectedCount,
  summary,
}: {
  environment: SessionEnvironment;
  session: SessionInfo;
  context: SessionContext;
  connectors: SessionConnector[];
  connectedCount: number;
  summary: string;
}) {
  const [open, setOpen] = useState<StripChip | null>(null);
  const props = (chip: StripChip) => ({
    open: open === chip,
    onOpenChange: (next: boolean) => setOpen(next ? chip : null),
  });
  const toggle = (chip: StripChip) => () => setOpen((current) => (current === chip ? null : chip));
  const needsAttention = connectors.some(
    (connector) => connector.state === "sign-in" || connector.state === "reconnect",
  );
  const percent = Math.round((context.used / context.total) * 100);

  return (
    <SessionStrip summary={summary}>
      <ChipPopover
        {...props("environment")}
        chip={
          <SessionChip open={open === "environment"} onClick={toggle("environment")}>
            <StatusDot tone="green" />
            <span className="font-mono text-ink-2">{environment.host}</span>
            <span className="text-ink-4">{environment.services.length} services</span>
          </SessionChip>
        }
      >
        <EnvironmentPopover environment={environment} />
      </ChipPopover>
      <ChipPopover
        {...props("session")}
        chip={
          <SessionChip open={open === "session"} onClick={toggle("session")}>
            <ClaudeTile size={16} />
            {session.account} · {session.model.split(" · ")[0]}
          </SessionChip>
        }
      >
        <SessionInfoPopover session={session} />
      </ChipPopover>
      <ChipPopover
        {...props("context")}
        chip={
          <SessionChip open={open === "context"} onClick={toggle("context")}>
            <Meter value={percent} tone="blue" width={28} showValue={false} />
            <span className="tabular-nums">{percent}% context</span>
          </SessionChip>
        }
      >
        <ContextPopover context={context} />
      </ChipPopover>
      <ChipPopover
        {...props("connectors")}
        chip={
          <SessionChip open={open === "connectors"} onClick={toggle("connectors")}>
            <Plug width={12} height={12} strokeWidth={2} />
            {connectedCount} connectors
            {needsAttention && <StatusDot tone="orange" />}
          </SessionChip>
        }
      >
        <ConnectorsPopover connectors={connectors} connectedCount={connectedCount} />
      </ChipPopover>
    </SessionStrip>
  );
}
