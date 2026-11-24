import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { DITHER_COLUMN_START_PX, DITHER_COLUMN_STEP_PX, DITHER_OFFSETS } from "@/lib/dither";
import { cn } from "@/lib/utils";

const tint = (token: string, percent: number) =>
  `color-mix(in srgb, var(--${token}) ${percent}%, transparent)`;

const COLUMNS = DITHER_OFFSETS.length;
const COLUMN_START_PX = DITHER_COLUMN_START_PX;
const COLUMN_STEP_PX = DITHER_COLUMN_STEP_PX;
const STEP_MS = 110;
const STEPS_PER_CHANGE = 10;
const BREATHE_MS = 4800;
const BREATHE_STEP_MS = 400;

export type DitherFamily = "green" | "violet";

const SPARSE_COLUMN = 6;
const columnX = (column: number) => COLUMN_START_PX + column * COLUMN_STEP_PX;
const NONE_X = columnX(COLUMNS);

const RAMP: Record<DitherFamily, { far: string; mid: string; near: string; edge: string }> = {
  green: {
    far: tint("accent", 42),
    mid: tint("accent", 66),
    near: tint("green", 50),
    edge: tint("accent-ink", 46),
  },
  violet: {
    far: tint("violet-deep", 44),
    mid: tint("violet-deep", 66),
    near: tint("violet", 50),
    edge: tint("violet-ink", 46),
  },
};

function columnColor(family: DitherFamily, rank: number) {
  const ramp = RAMP[family];
  if (rank < 4) return ramp.near;
  return rank < 8 ? ramp.mid : ramp.far;
}

type Sweep = { front: number; target: number; stepsLeft: number };

function useSweep(target: number) {
  const [sweep, setSweep] = useState<Sweep>({ front: target, target, stepsLeft: 0 });
  if (sweep.target !== target) {
    setSweep({ front: sweep.front, target, stepsLeft: STEPS_PER_CHANGE });
  }
  useEffect(() => {
    if (sweep.stepsLeft === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(
      () =>
        setSweep((current) =>
          reduced || current.stepsLeft <= 1
            ? { ...current, front: current.target, stepsLeft: 0 }
            : {
                ...current,
                front: current.front + (current.target - current.front) / current.stepsLeft,
                stepsLeft: current.stepsLeft - 1,
              },
        ),
      reduced ? 0 : STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [sweep]);
  return sweep.front;
}

function useBreathePhase() {
  const [phase] = useState(() => performance.now() % BREATHE_MS);
  return phase;
}

export function DitherField({
  column,
  family,
  className,
}: {
  column: number | null;
  family: DitherFamily;
  className?: string;
}) {
  const front = useSweep(column === null ? NONE_X : columnX(column));
  const phase = useBreathePhase();
  const leftmost = Math.max(Math.floor((front - COLUMN_START_PX) / COLUMN_STEP_PX), 0);
  return (
    <div
      aria-hidden
      className={cn("effort-dither", className)}
      style={{ opacity: front >= columnX(SPARSE_COLUMN) ? 0.72 : 1 }}
    >
      {DITHER_OFFSETS.map((_, index) => {
        const shown = index >= leftmost && front < NONE_X;
        const [px, py] = DITHER_OFFSETS[Math.max(index - leftmost, 0)];
        const rank = COLUMNS - 1 - index;
        const x = columnX(index);
        const style = {
          "--x": `${x}px`,
          "--left": `${Math.max(x, front)}px`,
          "--px": `${px}px`,
          "--py": `${py}px`,
        } as CSSProperties;
        return (
          <Fragment key={index}>
            <span
              className="effort-dither-layer"
              data-hidden={!shown || undefined}
              style={{ ...style, color: columnColor(family, rank) }}
            />
            <span
              className="effort-dither-edge"
              data-hidden={!shown || x - COLUMN_STEP_PX < front || undefined}
              style={{
                ...style,
                color: RAMP[family].edge,
                animationDelay: `${rank * BREATHE_STEP_MS - BREATHE_MS - phase}ms`,
              }}
            />
          </Fragment>
        );
      })}
    </div>
  );
}
