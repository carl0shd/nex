import {
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { EFFORTS, EFFORT_LABEL, EFFORT_TONE, type Effort } from "@/components/composer/effort";
import { cn } from "@/lib/utils";

const STEPS = ["low", "medium", "high", "xhigh", "max"] as const;
const ULTRA_TRACK = 0.7;
const ULTRA_GATE = 0.73;
const DITHER_OFFSETS = [
  [0, 0],
  [6, 6],
  [6, 0],
  [0, 6],
  [3, 3],
  [9, 9],
  [9, 3],
  [3, 9],
  [3, 0],
  [9, 6],
  [9, 0],
  [3, 6],
] as const;

const tint = (token: string, percent: number) =>
  `color-mix(in srgb, var(--${token}) ${percent}%, transparent)`;
const repeat = (dot: string, count: number) => Array.from({ length: count }, () => dot);

type DitheredEffort = "xhigh" | "max" | "ultracode";

const DITHER: Record<
  DitheredEffort,
  { start: number; opacity: number; from: string; delay: number; edge: string; dots: string[] }
> = {
  xhigh: {
    start: 138,
    opacity: 0.72,
    from: "75%",
    delay: 120,
    edge: tint("accent-ink", 46),
    dots: [...repeat(tint("accent", 66), 2), ...repeat(tint("green", 50), 4)],
  },
  max: {
    start: 75,
    opacity: 1,
    from: "100%",
    delay: 120,
    edge: tint("accent-ink", 46),
    dots: [tint("accent", 42), ...repeat(tint("accent", 66), 4), ...repeat(tint("green", 50), 4)],
  },
  ultracode: {
    start: 12,
    opacity: 1,
    from: "100%",
    delay: 380,
    edge: tint("violet-ink", 46),
    dots: [
      ...repeat(tint("violet-deep", 44), 4),
      ...repeat(tint("violet-deep", 66), 4),
      ...repeat(tint("violet", 50), 4),
    ],
  },
};

function isDithered(effort: Effort): effort is DitheredEffort {
  return effort in DITHER;
}

function DitherField({ effort }: { effort: DitheredEffort }) {
  const { start, opacity, from, delay, edge, dots } = DITHER[effort];
  const layer = (index: number, dot: string) =>
    ({
      "--x": `${start + index * 21}px`,
      "--px": `${DITHER_OFFSETS[index][0]}px`,
      "--py": `${DITHER_OFFSETS[index][1]}px`,
      "--dot": dot,
      "--from": from,
      "--delay": `${delay}ms`,
      "--rank": dots.length - 1 - index,
    }) as CSSProperties;
  return (
    <div aria-hidden className="effort-dither" style={{ opacity }}>
      {dots.map((dot, index) => (
        <span key={`layer-${index}`} className="effort-dither-layer" style={layer(index, dot)} />
      ))}
      {dots.map((_, index) => (
        <span key={`edge-${index}`} className="effort-dither-edge" style={layer(index, edge)} />
      ))}
    </div>
  );
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
  const step = ultra ? STEPS.length - 1 : STEPS.indexOf(value);
  const thumbPercent = ultra ? 100 : step * 25;

  const effortAt = (clientX: number, fromPress: boolean): Effort => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return value;
    const fraction = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    if (ultra) {
      return fraction > ULTRA_GATE
        ? "ultracode"
        : STEPS[Math.round((Math.min(fraction, ULTRA_TRACK) / ULTRA_TRACK) * 4)];
    }
    const nearest = STEPS[Math.round(fraction * 4)];
    return fromPress && value === "max" && nearest === "max" ? "ultracode" : nearest;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(effortAt(event.clientX, true));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const next = effortAt(event.clientX, false);
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
      End: STEPS.length - 1,
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
      {isDithered(value) && <DitherField key={value} effort={value} />}
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
        className="relative mx-4 mt-1 h-[18px] cursor-pointer rounded-[6px] outline-none select-none before:absolute before:inset-y-[3px] before:-right-[7px] before:-left-[7px] before:rounded-full before:bg-surface-raised/82 focus-visible:shadow-[0_0_0_1px_var(--line-focus)]"
      >
        <span
          className="absolute top-[7px] left-0 h-1 rounded-full bg-line-strong transition-[width] duration-300 ease-out-strong"
          style={{ width: ultra ? "calc(70% + 2px)" : "100%" }}
        />
        <span
          className={cn(
            "absolute top-[7px] left-0 h-1 rounded-full transition-[width,opacity] duration-300 ease-out-strong",
            ultra ? "bg-violet-deep opacity-60" : "bg-accent",
          )}
          style={{ width: ultra ? "calc(70% + 2px)" : `${thumbPercent}%` }}
        />
        {STEPS.map((stepName, index) => (
          <span
            key={stepName}
            className={cn(
              "absolute top-1/2 -mt-0.5 -ml-0.5 size-1 rounded-full transition-[left,background-color] duration-300 ease-out-strong",
              index <= step ? "bg-on-accent/55" : "bg-ink/22",
            )}
            style={{ left: `${index * (ultra ? 17.5 : 25)}%` }}
          />
        ))}
        <span
          className={cn(
            "absolute top-[5px] left-[73%] h-2 w-px rounded-[1px] bg-ink/22 transition-[opacity,scale] duration-150 ease-out-strong",
            ultra ? "scale-y-100 opacity-100 delay-300" : "scale-y-0 opacity-0",
          )}
        />
        <span
          className={cn(
            "absolute top-2 right-0 left-[76%] h-0.5 origin-left rounded-full bg-violet-ink transition-[scale] duration-200 ease-out-strong",
            ultra ? "scale-x-100 delay-300" : "scale-x-0",
          )}
        />
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
