import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    <Card
      asChild
      className={cn(
        'w-full cursor-pointer flex-row items-center gap-3 rounded-md bg-bg-input p-3',
        selected ? 'border-border-hover' : 'hover:border-border-hover'
      )}
    >
      <button type="button" onClick={onClick}>
        <div className="flex size-10 items-center justify-center rounded-md bg-border">{icon}</div>
        <div className="flex flex-1 flex-col items-start gap-0.5">
          <span className={titleClassName ?? 'text-[13px] font-medium text-text'}>{title}</span>
          <span className="text-left text-[11px] text-text-muted">{subtitle}</span>
        </div>
        {selected && (
          <div className="flex size-5 items-center justify-center rounded-full bg-accent">
            <Check size={12} className="text-text" />
          </div>
        )}
      </button>
    </Card>
  );
}

export default OptionCard;
