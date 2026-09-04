import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const tile = cva('flex flex-col border', {
  variants: {
    size: {
      default: 'gap-0.5 rounded-lg px-3 py-2.5',
      compact: 'rounded-md px-2.5 py-1.25'
    },
    surface: {
      panel: 'border-border-tile bg-bg-tile',
      menu: 'border-border-tile-menu bg-bg-tile-menu'
    }
  },
  defaultVariants: { size: 'default', surface: 'panel' }
});

const amount = cva('font-mono text-text tabular-nums', {
  variants: {
    size: { default: '', compact: 'leading-tight' },
    variant: { hero: '', compact: '' }
  },
  compoundVariants: [
    { size: 'default', variant: 'hero', class: 'text-2xl' },
    { size: 'default', variant: 'compact', class: 'text-base' },
    { size: 'compact', variant: 'hero', class: 'text-xl' },
    { size: 'compact', variant: 'compact', class: 'text-[13px]' }
  ],
  defaultVariants: { size: 'default', variant: 'compact' }
});

interface StatTileProps extends VariantProps<typeof tile> {
  label: string;
  value: string;
  sublabel?: string;
  variant?: 'hero' | 'compact';
  className?: string;
}

function StatTile({
  label,
  value,
  sublabel,
  variant = 'compact',
  size = 'default',
  surface = 'panel',
  className
}: StatTileProps): React.JSX.Element {
  return (
    <div data-slot="stat-tile" className={cn(tile({ size, surface }), className)}>
      <span className="text-[10px] tracking-wide text-text-muted uppercase">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={cn(amount({ size, variant }))}>{value}</span>
        {sublabel && <span className="text-[10px] text-text-muted">{sublabel}</span>}
      </div>
    </div>
  );
}

export default StatTile;
