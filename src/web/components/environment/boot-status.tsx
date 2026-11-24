import type { ReactNode } from "react";
import { Orbit } from "@/components/atoms/orbit";
import { DitherField } from "@/components/atoms/dither-field";
import {
  DITHER_COLUMN_START_PX,
  DITHER_COLUMN_STEP_PX,
  DITHER_OFFSETS,
  ditherColumnAtX,
} from "@/lib/dither";
import { cn } from "@/lib/utils";

const RUNNING_SHARE = 0.5;
const FIELD_END_PX = DITHER_COLUMN_START_PX + DITHER_OFFSETS.length * DITHER_COLUMN_STEP_PX;

const progress = (step: number, total: number) =>
  step >= total ? 1 : (step + RUNNING_SHARE) / Math.max(total, 1);

function Backdrop({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn("-mx-1 flex items-center gap-1.5 rounded-[4px] bg-surface/88 px-1", className)}
    >
      {children}
    </span>
  );
}

export function BootStatus({ label, step, total }: { label: string; step: number; total: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={0}
      aria-valuemax={total}
      className="relative isolate h-7 w-[300px] overflow-hidden rounded-control bg-hover/60"
    >
      <DitherField
        column={ditherColumnAtX(FIELD_END_PX * (1 - progress(step, total)))}
        family="green"
        className="-scale-x-100"
      />
      <div className="relative flex h-full items-center px-2.5 text-2xs text-ink-3">
        <Backdrop>
          <Orbit size="sm" />
          {label}
        </Backdrop>
        <Backdrop className="ml-auto text-ink-4 tabular-nums">
          {step} of {total}
        </Backdrop>
      </div>
    </div>
  );
}
