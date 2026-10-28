import { HelpCircle } from "iconoir-react";
import { SelectionMark } from "@/components/atoms/selection-mark";
import GlideMenu from "@/components/primitives/glide-menu";
import { cn } from "@/lib/utils";

export type QuestionOption = { value: string; label: string; hint?: string };

export function QuestionCard({
  question,
  options,
  value,
  onChange,
}: {
  question: string;
  options: QuestionOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-menu bg-surface-raised px-3.5 py-3 shadow-[0_0_0_1px_var(--ring-waiting)]">
      <div className="flex items-center gap-[9px]">
        <span className="flex w-3.5 shrink-0 justify-center text-orange">
          <HelpCircle width={13} height={13} strokeWidth={2} />
        </span>
        <span className="text-sm font-medium text-ink">{question}</span>
      </div>
      <GlideMenu role="radiogroup" className="flex flex-col gap-0.5">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              data-menu-row
              onClick={() => onChange(option.value)}
              className={cn(
                "interactive press-large relative flex min-h-[38px] cursor-pointer items-center gap-2.5 rounded-control px-2.5 text-left select-none",
                selected && "bg-field",
              )}
            >
              <SelectionMark selected={selected} />
              <span className="flex flex-col">
                <span className="text-xs text-ink">{option.label}</span>
                {option.hint && <span className="text-2xs text-ink-4">{option.hint}</span>}
              </span>
            </button>
          );
        })}
      </GlideMenu>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="interactive press h-7 cursor-pointer rounded-full bg-accent px-3 text-xs font-medium text-on-accent select-none hover:bg-accent-hover"
        >
          Answer
        </button>
        <button
          type="button"
          className="interactive press h-7 cursor-pointer rounded-full px-3 text-xs font-medium text-ink-3 select-none hover:text-ink-2"
        >
          Other…
        </button>
        <span className="ml-auto text-2xs text-ink-4">1–{options.length} to pick</span>
      </div>
    </div>
  );
}
