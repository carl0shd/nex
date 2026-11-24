import { ExternalLink } from "lucide-react";
import { StatusDot } from "@/components/atoms/status-dot";
import { BootStatus } from "@/components/environment/boot-status";

export type EnvStartState =
  | { kind: "starting" | "filling"; step: number; total: number }
  | {
      kind: "ready";
      addresses: readonly EnvAddress[];
      readyIn?: string;
      onOpen?: (url: string) => void;
    }
  | { kind: "waiting"; running: number; max: number; suggestion?: string; onPause?: () => void }
  | { kind: "off"; onStart?: () => void };

export interface EnvAddress {
  label: string;
  url: string;
}

function AddressPill({ address, onOpen }: { address: EnvAddress; onOpen?: (url: string) => void }) {
  return (
    <button
      type="button"
      title={address.url}
      onClick={() => onOpen?.(address.url)}
      className="interactive press flex h-[22px] max-w-[300px] cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-2xs text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)] select-none hover:bg-hover hover:text-ink"
    >
      <StatusDot tone="green" size={5} />
      <span className="truncate">{address.label}</span>
      <ExternalLink width={10} height={10} strokeWidth={2} className="text-ink-4" />
    </button>
  );
}

export function EnvStartStatus({ state }: { state: EnvStartState }) {
  return (
    <div className="rise-in mt-2 flex flex-col items-center gap-2 [animation-delay:150ms]">
      {(state.kind === "starting" || state.kind === "filling") && (
        <>
          <BootStatus
            label={state.kind === "filling" ? "Filling its databases" : "Starting its environment"}
            step={state.step}
            total={state.total}
          />
          <span className="text-2xs text-ink-4">
            You can write now. Claude starts as soon as you send.
          </span>
        </>
      )}
      {state.kind === "ready" && (
        <>
          {state.addresses.map((address) => (
            <AddressPill key={address.url} address={address} onOpen={state.onOpen} />
          ))}
          <span className="text-2xs text-ink-4">
            {state.readyIn ? `Environment ready in ${state.readyIn}` : "Environment ready"}
          </span>
        </>
      )}
      {state.kind === "off" && (
        <span className="text-2xs text-ink-4">
          Its environment is off.{" "}
          <button
            type="button"
            onClick={state.onStart}
            className="interactive press cursor-pointer text-ink-3 underline underline-offset-2 select-none hover:text-ink"
          >
            Start it
          </button>
        </span>
      )}
      {state.kind === "waiting" && (
        <>
          <span className="flex items-center gap-2 text-xs text-ink-2">
            <StatusDot tone="idle" />
            Waiting for room · {state.running} of {state.max} environments running
          </span>
          <span className="max-w-[300px] text-2xs text-ink-4">
            It starts when another task pauses.
            {state.suggestion && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={state.onPause}
                  className="interactive press cursor-pointer text-ink-3 underline underline-offset-2 select-none hover:text-ink"
                >
                  Pause {state.suggestion} now
                </button>
              </>
            )}
          </span>
        </>
      )}
    </div>
  );
}
