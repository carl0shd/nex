import { cn } from '@/lib/utils';

type SettingRowVariant = 'card' | 'plain';

interface SettingRowProps {
  title: string;
  description?: string;
  control?: React.ReactNode;
  variant?: SettingRowVariant;
  className?: string;
}

const variantStyles: Record<SettingRowVariant, string> = {
  card: 'rounded-panel bg-surface p-3.5 shadow-card',
  plain: 'px-3 py-2.5'
};

function SettingRow({
  title,
  description,
  control,
  variant = 'card',
  className
}: SettingRowProps): React.JSX.Element {
  return (
    <div className={cn('flex items-center gap-4', variantStyles[variant], className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">{title}</span>
        {description && <span className="text-xs text-ink-3">{description}</span>}
      </div>
      {control && <div className="flex shrink-0 items-center gap-2">{control}</div>}
    </div>
  );
}

function SettingValue({ className, ...props }: React.ComponentProps<'span'>): React.JSX.Element {
  return <span className={cn('font-mono text-2xs text-ink-3', className)} {...props} />;
}

export default SettingRow;
export { SettingValue };
