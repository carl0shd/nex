import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Chip from '@/components/ui/chip';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  label?: string;
  placeholder?: string;
}

function Dropdown({
  value,
  onChange,
  options,
  label,
  placeholder
}: DropdownProps): React.JSX.Element {
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[10px] font-medium text-text-muted">{label}</label>}
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <div className="relative">
            <ListboxButton
              className={`flex h-9 w-full cursor-pointer items-center gap-2 rounded border px-2.5 ${
                open ? 'border-border' : 'border-border-soft'
              } bg-bg-input`}
            >
              {selected?.icon}
              <span className="flex-1 truncate text-left text-[12px] text-text">
                {selected?.label ?? (
                  <span className="text-text-placeholder">{placeholder ?? 'Select...'}</span>
                )}
              </span>
              {selected?.badge && <Chip>{selected.badge}</Chip>}
              {open ? (
                <ChevronUp size={12} className="shrink-0 text-text-muted" />
              ) : (
                <ChevronDown size={12} className="shrink-0 text-text-muted" />
              )}
            </ListboxButton>
            <ListboxOptions className="absolute top-full right-0 left-0 z-10 mt-1 flex flex-col gap-1 rounded-md border border-border-soft bg-bg-input p-1 shadow-[0_6px_16px_1px_#00000040]">
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 data-[focus]:bg-bg-item-active"
                >
                  {option.icon}
                  <span
                    className={`flex-1 text-[12px] ${
                      option.value === value ? 'text-text' : 'text-text-secondary'
                    }`}
                  >
                    {option.label}
                  </span>
                  {option.badge && <Chip>{option.badge}</Chip>}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        )}
      </Listbox>
    </div>
  );
}

export default Dropdown;
export type { DropdownOption };
