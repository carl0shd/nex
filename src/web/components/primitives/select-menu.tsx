import { useState } from "react";
import { Search } from "lucide-react";
import { SelectButton } from "@/components/atoms/select-button";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Menu, MenuItem } from "@/components/primitives/menu";
import { VirtualMenu } from "@/components/primitives/virtual-menu";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

const SEARCH_FROM = 8;
const LIST_MAX_HEIGHT = 296;

export function SelectMenu<T extends string>({
  value,
  options,
  onChange,
  mono = false,
  className,
}: {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  mono?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = options.find((option) => option.value === value);
  const searchable = options.length > SEARCH_FROM;
  const shown = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
    : options;
  const item = (option: SelectOption<T>) => (
    <MenuItem
      key={option.value}
      checked={option.value === value}
      onSelect={() => {
        onChange(option.value);
        setOpen(false);
        setQuery("");
      }}
    >
      <span title={option.label} className="truncate">
        {option.label}
      </span>
    </MenuItem>
  );

  return (
    <AnchoredPopover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
      side="bottom"
      align="end"
      strategy="fixed"
      trigger={
        <SelectButton
          value={current?.label ?? value}
          mono={mono}
          onClick={() => setOpen((next) => !next)}
          className={className}
        />
      }
    >
      {searchable ? (
        <VirtualMenu
          width={280}
          maxHeight={LIST_MAX_HEIGHT}
          items={shown}
          itemKey={(option) => option.value}
          selectedIndex={shown.findIndex((option) => option.value === value)}
          header={
            <label className="mb-1 flex h-8 items-center gap-2 border-b border-line px-2.5 text-xs text-ink-4">
              <Search width={12} height={12} strokeWidth={2} />
              <input
                autoFocus
                aria-label="Search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-4"
              />
            </label>
          }
          empty={
            <span className="truncate px-2.5 py-2 text-xs text-ink-4">
              Nothing matches “{query}”
            </span>
          }
          renderItem={item}
        />
      ) : (
        <Menu width={220} origin="top">
          {options.map(item)}
        </Menu>
      )}
    </AnchoredPopover>
  );
}
