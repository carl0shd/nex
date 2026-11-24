import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Expand } from "@/components/atoms/expand";
import { SideScroll } from "@/components/atoms/side-scroll";
import { Orbit } from "@/components/atoms/orbit";
import { StatusDot } from "@/components/atoms/status-dot";
import { BootField } from "@/components/environment/boot-field";
import { cn } from "@/lib/utils";

export interface StartingService {
  name: string;
  state: "done" | "running" | "pending";
}

export type EnvBannerState =
  | { kind: "starting"; services: readonly StartingService[]; elapsed: string }
  | { kind: "paused"; idleFor?: string; onResume?: () => void }
  | {
      kind: "down";
      service: string;
      code: number | null;
      error: string;
      onRestart?: () => void;
      onViewLog?: () => void;
    }
  | { kind: "failed"; error: string; onRetry?: () => void; onViewLog?: () => void }
  | { kind: "ports"; title: string; detail: string }
  | {
      kind: "waiting";
      reason: "memory" | "room";
      detail: string;
      suggestion?: string;
      onManage?: () => void;
      onPause?: () => void;
    };

const TAG =
  "relative z-10 flex h-[22px] shrink-0 items-center gap-1.5 rounded-chip bg-surface/90 px-[7px] text-2xs whitespace-nowrap";

function DoneMark() {
  return (
    <span className="flex size-3.5 items-center justify-center rounded-full bg-green/20 text-accent-ink">
      <Check width={8} height={8} strokeWidth={3.5} />
    </span>
  );
}

function StartingStep({ service }: { service: StartingService }) {
  return (
    <span
      className={cn(
        TAG,
        service.state === "pending"
          ? "text-ink-4"
          : service.state === "running"
            ? "text-ink"
            : "text-ink-3",
      )}
    >
      {service.state === "done" && <DoneMark />}
      {service.state === "running" && <Orbit size="sm" />}
      {service.name}
    </span>
  );
}

const RUNNING_SHARE = 0.5;

function progressFront(services: readonly StartingService[]): string {
  if (services.length === 0) return "0%";
  const reached = services.reduce(
    (sum, service) =>
      sum + (service.state === "done" ? 1 : service.state === "running" ? RUNNING_SHARE : 0),
    0,
  );
  return `${((reached / services.length) * 100).toFixed(2)}%`;
}

const STRIP_START = 12;
const STRIP_END = 14;
const META_GAP = 8;

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setWidth(node.offsetWidth));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function StartingStrip({
  services,
  elapsed,
}: {
  services: readonly StartingService[];
  elapsed: string;
}) {
  const done = services.filter((service) => service.state === "done").length;
  const current = services.find((service) => service.state === "running")?.name;
  const [metaRef, metaWidth] = useWidth<HTMLSpanElement>();
  return (
    <>
      <BootField front={progressFront(services)} />
      <SideScroll
        focusKey={current}
        startInset={STRIP_START}
        endInset={metaWidth + STRIP_END + META_GAP}
        className="absolute inset-0 z-10"
      >
        <span className="flex items-center gap-2">
          {services.map((service) => (
            <span
              key={service.name}
              data-scroll-focus={service.name === current || undefined}
              className="flex"
            >
              <StartingStep service={service} />
            </span>
          ))}
        </span>
      </SideScroll>
      <span ref={metaRef} className={cn(TAG, "z-20 ml-auto text-ink-4 tabular-nums")}>
        {done} of {services.length} · {elapsed}
      </span>
    </>
  );
}

export function EnvBanner({ state }: { state: EnvBannerState }) {
  return (
    <div
      role="status"
      className={cn(
        "relative isolate flex min-h-10 items-center gap-3 overflow-hidden border-b border-line px-4 py-2 text-xs",
        state.kind === "starting" && "h-10 gap-2 border-line-soft py-0 pr-3.5 pl-3",
        (state.kind === "down" || state.kind === "failed") && "bg-red-tint/40",
        (state.kind === "waiting" || state.kind === "ports") && "bg-orange-tint/40",
        state.kind === "paused" && "bg-hover/60",
      )}
    >
      {state.kind === "starting" && (
        <StartingStrip services={state.services} elapsed={state.elapsed} />
      )}
      {state.kind === "paused" && (
        <>
          <span className="flex-1 text-ink-2">
            {state.idleFor
              ? `Environment paused after ${state.idleFor} idle to free memory. It resumes when you open the task.`
              : "Environment paused. Its data stays until you resume it."}
          </span>
          <Button size="xs" onClick={state.onResume}>
            Resume
          </Button>
        </>
      )}
      {state.kind === "down" && (
        <>
          <StatusDot tone="red" />
          <span className="shrink-0 font-medium text-ink">
            {state.code === null
              ? `${state.service} stopped`
              : `${state.service} exited with code ${state.code}`}
          </span>
          <span className="min-w-0 flex-1 truncate font-mono text-2xs text-ink-4">
            {state.error}
          </span>
          <Button size="xs" onClick={state.onViewLog}>
            View log
          </Button>
          <Button variant="inverse" size="xs" onClick={state.onRestart}>
            Restart
          </Button>
        </>
      )}
      {state.kind === "failed" && (
        <>
          <StatusDot tone="red" />
          <span className="shrink-0 font-medium text-ink">Environment didn’t start</span>
          <span className="min-w-0 flex-1 truncate font-mono text-2xs text-ink-4">
            {state.error}
          </span>
          <Button size="xs" onClick={state.onViewLog}>
            View log
          </Button>
          <Button variant="inverse" size="xs" onClick={state.onRetry}>
            Try again
          </Button>
        </>
      )}
      {state.kind === "ports" && (
        <>
          <StatusDot tone="orange" />
          <span className="shrink-0 font-medium text-ink">{state.title}</span>
          <span title={state.detail} className="min-w-0 flex-1 truncate text-2xs text-ink-4">
            {state.detail}
          </span>
        </>
      )}
      {state.kind === "waiting" && (
        <>
          <StatusDot tone="orange" />
          <span className="shrink-0 font-medium text-ink">
            {state.reason === "memory" ? "Waiting for memory" : "Waiting for room"}
          </span>
          <span className="min-w-0 flex-1 truncate text-2xs text-ink-4 tabular-nums">
            {state.detail}
          </span>
          <Button size="xs" onClick={state.onManage}>
            Manage
          </Button>
          {state.suggestion && (
            <Button variant="inverse" size="xs" onClick={state.onPause}>
              <span className="max-w-[160px] truncate" title={state.suggestion}>
                Pause {state.suggestion}
              </span>
            </Button>
          )}
        </>
      )}
    </div>
  );
}

const SLOT_CLOSE_MS = 300;

export function EnvBannerSlot({ state }: { state: EnvBannerState | null }) {
  const [shown, setShown] = useState(state);
  if (state && state !== shown) setShown(state);
  useEffect(() => {
    if (state) return;
    const timer = setTimeout(() => setShown(null), SLOT_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [state]);
  return <Expand open={state !== null}>{shown && <EnvBanner state={shown} />}</Expand>;
}
