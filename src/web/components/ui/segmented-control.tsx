import type { LucideIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface SegmentedControlOption<T extends string> {
  value: T;
  label?: string;
  icon?: LucideIcon;
  title?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedControlOption<T>[];
  onChange: (value: T) => void;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  size = 'sm',
  className
}: SegmentedControlProps<T>): React.JSX.Element {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size={size}
      value={value}
      // Radix reports an empty string when the pressed item is toggled off; a
      // segmented control always keeps exactly one option selected.
      onValueChange={(next) => next && onChange(next as T)}
      className={cn('bg-bg', className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          title={option.title ?? option.label}
        >
          {option.icon && <option.icon size={13} />}
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export default SegmentedControl;
export type { SegmentedControlOption };
