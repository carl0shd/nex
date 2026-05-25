import { Check } from 'lucide-react';

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  titleClassName?: string;
}

function OptionCard({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  titleClassName
}: OptionCardProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-md p-3 ${
        selected
          ? 'border border-border-hover bg-bg-input'
          : 'border border-border-soft bg-bg-input hover:border-border-hover'
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-border">{icon}</div>
      <div className="flex flex-1 flex-col items-start gap-0.5">
        <span className={titleClassName ?? 'text-[13px] font-medium text-text'}>{title}</span>
        <span className="text-left text-[11px] text-text-muted">{subtitle}</span>
      </div>
      {selected && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
          <Check size={12} className="text-text" />
        </div>
      )}
    </button>
  );
}

export default OptionCard;
