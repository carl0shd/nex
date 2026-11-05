import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { EFFORTS, EFFORT_LABEL, EFFORT_TONE, type Effort } from "@/components/composer/effort";
import { DitherField, type DitherFamily } from "@/components/atoms/dither-field";
import { cn } from "@/lib/utils";

const LAST_STEP = EFFORTS.length - 1;
const FRONT_COLUMN: Partial<Record<Effort, number>> = { xhigh: 6, max: 3, ultracode: 0 };

function EffortDither({ effort }: { effort: Effort }) {
  const column = FRONT_COLUMN[effort];
  const [family, setFamily] = useState<DitherFamily>("green");
  const wanted: DitherFamily | null =
    effort === "ultracode" ? "violet" : column === undefined ? null : "green";
  if (wanted && wanted !== family) setFamily(wanted);
  return <DitherField column={column ?? null} family={family} />;
}

function Backdrop({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("-mx-1 rounded-[4px] bg-surface-raised/88 px-1", className)}>
      {children}
    </span>
  );
}

export function EffortSlider({
  value,
  onChange,
}: {
  value: Effort;
  onChange: (effort: Effort) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const ultra = value === "ultracode";
  const step = EFFORTS.indexOf(value);
  const thumbPercent = (step / LAST_STEP) * 100;

  const effortAt = (clientX: number): Effort => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return value;
    const fraction = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return EFFORTS[Math.round(fraction * LAST_STEP)];
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(effortAt(event.clientX));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const next = effortAt(event.clientX);
    if (next !== value) onChange(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = EFFORTS.indexOf(value);
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowUp: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index - 1,
      Home: 0,
      End: LAST_STEP,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    onChange(EFFORTS[Math.min(Math.max(moves[event.key], 0), EFFORTS.length - 1)]);
  };

  return (
    <div
      role="group"
      aria-label="Effort"
      className="relative isolate overflow-hidden rounded-control"
    >
      <EffortDither effort={value} />
      <div className="relative flex h-7 items-center px-2.5 text-2xs text-ink-4">
        <Backdrop className="leading-4">Effort</Backdrop>
        <span className="ml-auto flex">
          <Backdrop key={value} className={cn("effort-value-in leading-4", EFFORT_TONE[value])}>
            {EFFORT_LABEL[value]}
          </Backdrop>
        </span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Effort"
        aria-valuemin={1}
        aria-valuemax={EFFORTS.length}
        aria-valuenow={EFFORTS.indexOf(value) + 1}
        aria-valuetext={EFFORT_LABEL[value]}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className="relative mx-4 mt-1 h-[18px] cursor-pointer rounded-[6px] select-none before:absolute before:inset-y-[3px] before:-right-[7px] before:-left-[7px] before:rounded-full before:bg-surface-raised/82"
      >
        <span className="absolute top-[7px] left-0 h-1 w-full rounded-full bg-line-strong" />
        <span
          className={cn(
            "absolute top-[7px] left-0 h-1 rounded-full transition-[width,background-color] duration-300 ease-out-strong",
            ultra ? "bg-violet-deep" : "bg-accent",
          )}
          style={{ width: `${thumbPercent}%` }}
        />
        {EFFORTS.map((stepName, index) => (
          <span
            key={stepName}
            className={cn(
              "absolute top-1/2 -mt-0.5 -ml-0.5 size-1 rounded-full transition-[background-color] duration-300 ease-out-strong",
              index <= step
                ? "bg-on-accent/55"
                : stepName === "ultracode"
                  ? "bg-violet-ink/60"
                  : "bg-ink/22",
            )}
            style={{ left: `${(index / LAST_STEP) * 100}%` }}
          />
        ))}
        <span
          className={cn(
            "absolute top-0.5 -ml-[7px] size-3.5 rounded-full transition-[left,background-color] duration-150 ease-out-strong",
            ultra
              ? "effort-gate bg-violet-deep shadow-[0_0_0_2px_var(--surface-raised)]"
              : "bg-accent shadow-[0_1px_3px_rgb(0_0_0/50%)]",
          )}
          style={{ left: `${thumbPercent}%` }}
        >
          <span
            className={cn(
              "absolute inset-0 rounded-full bg-ink transition-[opacity,scale] duration-200 ease-out-strong",
              ultra && "scale-30 opacity-0 delay-[380ms]",
            )}
          />
        </span>
      </div>
      <div
        className={cn(
          "relative overflow-hidden text-3xs text-ink-4 transition-[height] duration-300 ease-out-strong",
          ultra ? "h-[42px]" : "h-[22px]",
        )}
      >
        {ultra ? (
          <div className="absolute inset-x-2.5 top-1.5 flex flex-col items-start gap-0.5 leading-[14px]">
            <Backdrop className="effort-value-in max-w-[calc(100%+8px)] truncate text-ink-2">
              Fans out parallel agents and cross-checks them
            </Backdrop>
            <Backdrop className="effort-value-in flex items-center gap-[5px] text-ink-3 [animation-delay:60ms]">
              <span className="size-1 shrink-0 rounded-full bg-orange" />
              Uses your limit fastest
            </Backdrop>
          </div>
        ) : (
          <div className="absolute inset-x-2.5 top-1.5 flex justify-between leading-3">
            <Backdrop>Faster</Backdrop>
            <Backdrop>Smarter</Backdrop>
          </div>
        )}
      </div>
    </div>
  );
}
