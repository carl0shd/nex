import { Terminal } from 'lucide-react';
import Chip from '@/components/ui/chip';

interface AgentCardOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string;
}

interface AgentCardSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: AgentCardOption[];
  label?: string;
}

function AgentCardSelector({
  value,
  onChange,
  options,
  label
}: AgentCardSelectorProps): React.JSX.Element {
  const columns = Math.min(Math.max(options.length, 1), 5);
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[10px] font-medium text-text-muted">{label}</label>}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          const iconColor = selected ? 'text-text' : 'text-text-secondary';
          return (
            <button
              key={opt.value}
              type="button"
              disabled={opt.disabled}
              onClick={() => onChange(opt.value)}
              className={`flex h-18 cursor-pointer select-none flex-col items-center justify-center gap-1.5 rounded-md border px-2 py-2.5 ${
                selected
                  ? 'border-selected-border bg-selected/10'
                  : 'border-border-soft bg-bg-input hover:border-border'
              } ${opt.disabled ? 'pointer-events-none opacity-40' : ''}`}
            >
              {opt.icon ?? <Terminal size={18} className={iconColor} />}
              <span
                className={`text-center text-[10px] font-medium leading-tight ${
                  selected ? 'text-text' : 'text-text-secondary'
                }`}
              >
                {opt.label}
              </span>
              {opt.badge && <Chip>{opt.badge}</Chip>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AgentCardSelector;
export type { AgentCardOption };
