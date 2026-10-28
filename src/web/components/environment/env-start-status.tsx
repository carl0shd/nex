import { OpenNewWindow } from "iconoir-react";
import { DitherProgress } from "@/components/atoms/dither-progress";
import { Orbit } from "@/components/atoms/orbit";
import { StatusDot } from "@/components/atoms/status-dot";

export type EnvStartState =
  | { kind: "starting"; step: number; total: number }
  | { kind: "ready"; addresses: readonly string[]; readyIn: string }
  | { kind: "waiting"; running: number; max: number; suggestion: string; onPause?: () => void }
  | { kind: "migrating"; step: number; total: number; migrations: number; baseDate: string };

function Progress({ label, step, total }: { label: string; step: number; total: number }) {
  return (
    <div className="flex w-[290px] flex-col gap-1.5">
      <DitherProgress value={(step / total) * 100} />
      <div className="flex items-center gap-1.5 text-2xs text-ink-3">
        <Orbit size="sm" />
        {label}
        <span className="ml-auto text-ink-4 tabular-nums">
          {step} of {total}
        </span>
      </div>
    </div>
  );
}

function AddressPill({ address }: { address: string }) {
  return (
    <button
      type="button"
      onClick={() => window.open(`https://${address}`, "_blank")}
      className="interactive press flex h-[22px] cursor-pointer items-center gap-1.5 rounded-full px-2.5 font-mono text-3xs text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)] select-none hover:bg-hover hover:text-ink"
    >
      <StatusDot tone="green" size={5} />
      {address}
      <OpenNewWindow width={10} height={10} strokeWidth={2} className="text-ink-4" />
    </button>
  );
}

export function EnvStartStatus({ state }: { state: EnvStartState }) {
  return (
    <div className="rise-in mt-2 flex flex-col items-center gap-2 [animation-delay:150ms]">
      {state.kind === "starting" && (
        <>
          <Progress label="Starting its environment" step={state.step} total={state.total} />
          <span className="text-2xs text-ink-4">
            You can write now. Claude starts as soon as you send.
          </span>
        </>
      )}
      {state.kind === "ready" && (
        <>
          {state.addresses.map((address) => (
            <AddressPill key={address} address={address} />
          ))}
          <span className="text-2xs text-ink-4">Environment ready in {state.readyIn}</span>
        </>
      )}
      {state.kind === "waiting" && (
        <>
          <span className="flex items-center gap-2 text-xs text-ink-2">
            <StatusDot tone="idle" />
            Waiting for room · {state.running} of {state.max} environments running
          </span>
          <span className="max-w-[300px] text-2xs text-ink-4">
            It starts when another task pauses.{" "}
            <button
              type="button"
              onClick={state.onPause}
              className="interactive cursor-pointer text-ink-3 underline underline-offset-2 select-none hover:text-ink"
            >
              Pause {state.suggestion} now
            </button>
          </span>
        </>
      )}
      {state.kind === "migrating" && (
        <>
          <Progress
            label={`Running ${state.migrations} new migrations from main`}
            step={state.step}
            total={state.total}
          />
          <span className="max-w-[300px] text-2xs text-ink-4">
            The clean base is from {state.baseDate}. Nex refreshes it in the background.
          </span>
        </>
      )}
    </div>
  );
}
