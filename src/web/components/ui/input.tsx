import type { LucideIcon } from 'lucide-react';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: LucideIcon;
  trailing?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

function Input({
  value,
  onChange,
  placeholder,
  label,
  icon: Icon,
  trailing,
  disabled = false,
  className = ''
}: InputProps): React.JSX.Element {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-[10px] font-medium text-text-muted">{label}</label>}
      <div
        className={`flex items-center gap-2 rounded-[5px] border border-border bg-bg-input px-2.5 py-2 not-focus-within:hover:border-border-strong focus-within:border-accent ${disabled ? 'opacity-50' : ''}`}
      >
        {Icon && <Icon size={14} className="shrink-0 text-text-muted" />}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent text-[12px] text-text-secondary placeholder:text-text-placeholder outline-none focus:text-text"
        />
        {trailing}
      </div>
    </div>
  );
}

export default Input;
