import { Check } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Kbd } from "@/components/atoms/kbd";
import { cn } from "@/lib/utils";

export interface FirstRunTip {
  keys: string;
  label: string;
}

export function FirstRunCard({
  tips,
  onDismiss,
  className,
}: {
  tips: readonly FirstRunTip[];
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "enter-toast flex w-[330px] flex-col gap-3 rounded-panel bg-glass p-4 shadow-toast backdrop-blur-[28px] backdrop-saturate-[1.1]",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-[22px] items-center justify-center rounded-full bg-accent text-on-accent">
          <Check width={11} height={11} strokeWidth={3.5} />
        </span>
        <span className="text-base font-semibold text-ink">You’re set</span>
      </div>
      <p className="m-0 text-xs leading-[18px] text-ink-3">
        Claude is working on your first task. A few things worth knowing:
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {tips.map((tip) => (
          <li key={tip.keys} className="flex items-center gap-2.5 text-xs text-ink-2">
            <span className="flex min-w-11">
              <Kbd className="px-1.5 text-ink-2">{tip.keys}</Kbd>
            </span>
            {tip.label}
          </li>
        ))}
      </ul>
      <Button variant="inverse" size="sm" className="self-end" onClick={onDismiss}>
        Got it
      </Button>
    </div>
  );
}
