import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { selectableVariants } from '@/components/ui/selectable';
import { cn } from '@/lib/utils';

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  titleClassName?: string;
  className?: string;
}

function OptionCard({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  titleClassName,
  className
}: OptionCardProps): React.JSX.Element {
  return (
    <Card
      asChild
      className={cn(
        selectableVariants({ selected }),
        'w-full flex-row items-center gap-3 p-3',
        className
      )}
    >
      <button type="button" onClick={onClick}>
        <div className="flex size-9 items-center justify-center rounded-control bg-muted shadow-hairline">
          {icon}
        </div>
        <div className="flex flex-1 flex-col items-start gap-0.5">
          <span className={titleClassName ?? 'text-sm font-medium text-ink'}>{title}</span>
          {subtitle && <span className="text-left text-2xs text-ink-3">{subtitle}</span>}
        </div>
        {selected && (
          <div className="flex size-5 animate-in items-center justify-center rounded-full bg-primary shadow-solid duration-200 ease-out-strong zoom-in-50">
            <Check size={12} strokeWidth={2.5} className="text-primary-foreground" />
          </div>
        )}
      </button>
    </Card>
  );
}

export default OptionCard;
