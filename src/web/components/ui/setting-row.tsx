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
  card: 'rounded-lg border border-border-soft bg-bg-soft p-3',
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
        <span className="text-[12px] font-medium text-text">{title}</span>
        {description && (
          <span className="text-[11px] leading-relaxed text-text-muted">{description}</span>
        )}
      </div>
      {control && <div className="flex shrink-0 items-center gap-2">{control}</div>}
    </div>
  );
}

function SettingValue({ className, ...props }: React.ComponentProps<'span'>): React.JSX.Element {
  return <span className={cn('font-mono text-[11px] text-text-muted', className)} {...props} />;
}

export default SettingRow;
export { SettingValue };
