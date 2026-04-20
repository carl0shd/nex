import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  trailing?: React.ReactNode;
  monospace?: boolean;
  disabled?: boolean;
}

function Checkbox({
  checked,
  onChange,
  label,
  trailing,
  monospace = false,
  disabled = false
}: CheckboxProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`flex w-full cursor-pointer select-none items-center gap-2 ${disabled ? 'pointer-events-none opacity-40' : ''}`}
    >
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
          checked ? 'border-transparent bg-selected' : 'border-border-soft bg-transparent'
        }`}
      >
        {checked && <Check size={10} className="text-text" strokeWidth={3} />}
      </span>
      {label !== undefined && (
        <span
          className={`flex-1 truncate text-left text-[11px] text-text-secondary ${monospace ? 'font-mono' : ''}`}
        >
          {label}
        </span>
      )}
      {trailing}
    </button>
  );
}

export default Checkbox;
