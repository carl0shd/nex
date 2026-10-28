import { Check, NavArrowDown } from "iconoir-react";
import { ComposerPill } from "@/components/composer/composer-pill";
import { EFFORT_LABEL, EFFORT_TONE, type Effort } from "@/components/composer/effort";
import { EffortSlider } from "@/components/composer/effort-slider";
import { Menu, MenuLabel, MenuSeparator } from "@/components/primitives/menu";
import { cn } from "@/lib/utils";

export interface ModelOption {
  id: string;
  name: string;
  short: string;
  tag: string;
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
  effort: Effort;
  open?: boolean;
  onClick?: () => void;
}) {
  const quiet = effort === "low" || effort === "medium" || effort === "high";
  return (
    <ComposerPill active={open} onClick={onClick} className="gap-[5px] pr-[9px]">
      {model}
      <span className={cn("flex items-center gap-1", quiet ? "text-ink-4" : EFFORT_TONE[effort])}>
        <span className="text-ink-4">·</span>
        {effort === "ultracode" && <UltracodeGlyph />}
        {EFFORT_LABEL[effort]}
      </span>
      <NavArrowDown width={10} height={10} strokeWidth={2.25} className="opacity-70" />
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
      className="interactive press-wide relative flex h-[34px] w-full cursor-pointer items-center gap-2 rounded-control px-2.5 text-left select-none"
    >
      <span className="flex w-3.5 text-accent-ink">
        {selected && <Check width={13} height={13} strokeWidth={2.75} />}
      </span>
      <span className="text-sm text-ink">{option.name}</span>
      <span className="ml-auto text-2xs text-ink-4">{option.tag}</span>
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
  return (
    <Menu width={270} origin="bottom left" className="rounded-panel bg-surface-raised">
      <MenuLabel className="h-7">Model</MenuLabel>
      {models.map((option) => (
        <ModelRow
          key={option.id}
          option={option}
          selected={option.id === model}
          onSelect={() => onModelChange(option.id)}
        />
      ))}
      <MenuSeparator />
      <EffortSlider value={effort} onChange={onEffortChange} />
    </Menu>
  );
}
