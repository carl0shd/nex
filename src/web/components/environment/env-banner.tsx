import { Check } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Orbit } from "@/components/atoms/orbit";
import { StatusDot } from "@/components/atoms/status-dot";
import { cn } from "@/lib/utils";

export interface StartingService {
  name: string;
  state: "done" | "running" | "pending";
}

export type EnvBannerState =
  | { kind: "starting"; services: readonly StartingService[]; elapsed: string }
  | { kind: "paused"; idleFor: string; onResume?: () => void }
  | {
      kind: "down";
      service: string;
      code: number;
      error: string;
      onRestart?: () => void;
      onViewLog?: () => void;
    }
  | {
      kind: "waiting";
      used: string;
      suggestion: string;
      onManage?: () => void;
      onPause?: () => void;
    };

function StartingStep({ service }: { service: StartingService }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-xs",
        service.state === "pending"
          ? "text-ink-4"
          : service.state === "running"
            ? "font-medium text-ink"
            : "text-ink-2",
      )}
    >
      {service.state === "done" && (
        <span className="flex size-3.5 items-center justify-center rounded-full bg-green-tint text-green">
          <Check width={8} height={8} strokeWidth={3.5} />
        </span>
      )}
      {service.state === "running" && <Orbit size="sm" />}
      {service.name}
    </span>
  );
}

export function EnvBanner({ state }: { state: EnvBannerState }) {
  return (
    <div
      role="status"
      className={cn(
        "relative flex min-h-10 items-center gap-3 overflow-hidden border-b border-line px-4 py-2 text-xs",
        state.kind === "down" && "bg-red-tint/40",
        state.kind === "waiting" && "bg-orange-tint/40",
        state.kind === "paused" && "bg-hover/60",
      )}
    >
      {state.kind === "starting" && (
        <>
          <span
            aria-hidden
            className="dither-fill absolute inset-y-0 left-0 text-green opacity-35 transition-[width] duration-500"
            style={{
              width: `${(state.services.filter((service) => service.state === "done").length / state.services.length) * 100}%`,
            }}
          />
          <span className="relative flex items-center gap-4">
            {state.services.map((service) => (
              <StartingStep key={service.name} service={service} />
            ))}
          </span>
          <span className="relative ml-auto text-2xs text-ink-4 tabular-nums">
            {state.services.filter((service) => service.state === "done").length} of{" "}
            {state.services.length} · {state.elapsed}
          </span>
        </>
      )}
      {state.kind === "paused" && (
        <>
          <span className="flex-1 text-ink-2">
            Environment paused after {state.idleFor} idle to free memory. It resumes when you open
            the task.
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
            {state.service} exited with code {state.code}
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
      {state.kind === "waiting" && (
        <>
          <StatusDot tone="orange" />
          <span className="font-medium text-ink">Waiting for memory</span>
          <span className="flex-1 text-2xs text-ink-4">{state.used} in use</span>
          <Button size="xs" onClick={state.onManage}>
            Manage
          </Button>
          <Button variant="inverse" size="xs" onClick={state.onPause}>
            Pause {state.suggestion}
          </Button>
        </>
      )}
    </div>
  );
}
