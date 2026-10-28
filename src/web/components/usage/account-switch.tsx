import { Monogram } from "@/components/atoms/entity-chip";
import { useSlidingThumb } from "@/hooks/use-sliding-thumb";
import { cn } from "@/lib/utils";

export interface UsageAccount {
  id: string;
  name: string;
  color: string;
}

export function AccountSwitch({
  accounts,
  value,
  onChange,
}: {
  accounts: readonly UsageAccount[];
  value: string;
  onChange: (id: string) => void;
}) {
  const activeIndex = accounts.findIndex((account) => account.id === value);
  const { containerRef, thumbRef } = useSlidingThumb<HTMLDivElement, HTMLSpanElement>(activeIndex);

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label="Account"
      className="relative flex gap-0.5 rounded-full bg-hover p-0.5"
    >
      <span
        ref={thumbRef}
        aria-hidden
        className="glide-thumb absolute top-0.5 bottom-0.5 rounded-full bg-control-off opacity-0 shadow-tab"
      />
      {accounts.map((account) => {
        const active = account.id === value;
        return (
          <button
            key={account.id}
            type="button"
            role="tab"
            data-thumb-item
            aria-selected={active}
            aria-label={account.name}
            title={account.name}
            onClick={() => onChange(account.id)}
            className={cn(
              "interactive press relative flex h-6 cursor-pointer items-center rounded-full text-xs font-medium text-ink select-none",
              active ? "gap-1.5 pr-2.5 pl-1" : "w-6 justify-center opacity-80 hover:opacity-100",
            )}
          >
            <Monogram size="sm" color={account.color} className="size-4 rounded-[5px]">
              {account.name[0]}
            </Monogram>
            {active && account.name}
          </button>
        );
      })}
    </div>
  );
}
