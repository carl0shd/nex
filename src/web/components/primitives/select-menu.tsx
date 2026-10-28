import { useState } from "react";
import { SelectButton } from "@/components/atoms/select-button";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Menu, MenuItem } from "@/components/primitives/menu";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

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
  const current = options.find((option) => option.value === value);
  return (
    <AnchoredPopover
      open={open}
      onOpenChange={setOpen}
      side="bottom"
      align="end"
      trigger={
        <SelectButton
          value={current?.label ?? value}
          mono={mono}
          onClick={() => setOpen((next) => !next)}
          className={className}
        />
      }
    >
      <Menu width={220} origin="top">
        {options.map((option) => (
          <MenuItem
            key={option.value}
            checked={option.value === value}
            onSelect={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </AnchoredPopover>
  );
}
