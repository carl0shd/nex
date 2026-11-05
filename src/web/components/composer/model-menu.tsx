import { Check, ChevronDown } from "lucide-react";
import { ComposerPill } from "@/components/composer/composer-pill";
import { EFFORT_LABEL, EFFORT_TONE, type Effort } from "@/components/composer/effort";
import { EffortSlider } from "@/components/composer/effort-slider";
import { Menu, MenuSeparator } from "@/components/primitives/menu";
import { cn } from "@/lib/utils";

export interface ModelOption {
  id: string;
  name: string;
  short: string;
  tag: string;
  summary?: string;
  efforts?: readonly string[];
  autoMode?: boolean;
}

function UltracodeGlyph() {
  return (
    <svg width={9} height={9} viewBox="0 0 10 10" aria-hidden className="fill-current">
      <circle cx={5} cy={1.8} r={1.4} />
      <circle cx={2} cy={7} r={1.4} />
      <circle cx={8} cy={7} r={1.4} />
    </svg>
  );
}

export function ModelChip({
  model,
  effort,
  open = false,
  onClick,
}: {
  model: string;
  effort: Effort | null;
  open?: boolean;
  onClick?: () => void;
}) {
  const quiet = effort === "low" || effort === "medium" || effort === "high";
  return (
    <ComposerPill active={open} onClick={onClick} className="gap-[5px] pr-[9px]">
      {model}
      {effort && (
        <span className={cn("flex items-center gap-1", quiet ? "text-ink-4" : EFFORT_TONE[effort])}>
          <span className="text-ink-4">·</span>
          {effort === "ultracode" && <UltracodeGlyph />}
          {EFFORT_LABEL[effort]}
        </span>
      )}
      <ChevronDown width={10} height={10} strokeWidth={2.25} className="opacity-70" />
    </ComposerPill>
  );
}

function ModelRow({
  option,
  selected,
  onSelect,
}: {
  option: ModelOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      data-menu-row
      onClick={onSelect}
      className={cn(
        "interactive press-wide relative flex w-full cursor-pointer items-center gap-2 rounded-control px-2.5 text-left select-none",
        option.summary ? "min-h-[46px] py-1.5" : "h-[34px]",
      )}
    >
      <span className="flex w-3.5 shrink-0 self-start pt-[3px] text-accent-ink">
        {selected && <Check width={13} height={13} strokeWidth={2.75} />}
      </span>
      {option.summary ? (
        <span className="flex min-w-0 flex-col">
          <span className="text-sm text-ink">{option.name}</span>
          <span className="truncate text-2xs text-ink-4" title={option.summary}>
            {option.summary}
          </span>
        </span>
      ) : (
        <>
          <span className="text-sm text-ink">{option.name}</span>
          <span className="ml-auto text-2xs text-ink-4">{option.tag}</span>
        </>
      )}
    </button>
  );
}

export function ModelMenu({
  models,
  model,
  onModelChange,
  effort,
  onEffortChange,
}: {
  models: readonly ModelOption[];
  model: string;
  onModelChange: (id: string) => void;
  effort: Effort;
  onEffortChange: (effort: Effort) => void;
}) {
  const current = models.find((option) => option.id === model);
  return (
    <Menu width={300} origin="bottom left" className="rounded-panel bg-surface-raised">
      {models.map((option) => (
        <ModelRow
          key={option.id}
          option={option}
          selected={option.id === model}
          onSelect={() => onModelChange(option.id)}
        />
      ))}
      {(current?.efforts?.length ?? 1) > 0 && (
        <>
          <MenuSeparator />
          <EffortSlider value={effort} onChange={onEffortChange} />
        </>
      )}
    </Menu>
  );
}
