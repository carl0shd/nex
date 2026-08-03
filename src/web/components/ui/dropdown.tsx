import Chip from '@/components/ui/chip';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

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
  disabled?: boolean;
}

/** Radix rejects `""` as an item value, so blank options round-trip through a sentinel. */
const EMPTY_VALUE = '__nex_empty__';

const toRadix = (value: string): string => (value === '' ? EMPTY_VALUE : value);
const fromRadix = (value: string): string => (value === EMPTY_VALUE ? '' : value);

function Dropdown({
  value,
  onChange,
  options,
  label,
  placeholder,
  disabled = false
}: DropdownProps): React.JSX.Element {
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Select
        value={toRadix(value)}
        onValueChange={(next) => onChange(fromRadix(next))}
        disabled={disabled}
      >
        <SelectTrigger>
          {selected?.icon}
          <span className="flex-1 truncate text-left">
            {selected ? (
              selected.label
            ) : (
              <span className="text-text-placeholder">{placeholder ?? 'Select...'}</span>
            )}
          </span>
          {selected?.badge && <Chip>{selected.badge}</Chip>}
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={toRadix(option.value)} showIndicator={false}>
              {option.icon}
              <span className="flex-1 truncate">{option.label}</span>
              {option.badge && <Chip>{option.badge}</Chip>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export default Dropdown;
export type { DropdownOption };
