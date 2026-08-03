import type { LucideIcon } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

interface IconToggleProps extends Omit<React.ComponentProps<typeof Toggle>, 'children' | 'size'> {
  icon: LucideIcon;
  iconSize?: number;
  size?: 'sm' | 'default' | 'lg';
}

function IconToggle({
  icon: Icon,
  iconSize = 13,
  size = 'sm',
  className,
  ...props
}: IconToggleProps): React.JSX.Element {
  return (
    <Toggle variant="outline" size={size} className={cn('bg-bg', className)} {...props}>
      <Icon size={iconSize} />
    </Toggle>
  );
}

export default IconToggle;
