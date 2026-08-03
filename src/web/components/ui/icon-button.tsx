import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type IconButtonVariant = 'ghost' | 'default' | 'filled';

interface IconButtonProps extends Omit<React.ComponentProps<typeof Button>, 'variant' | 'size'> {
  icon: LucideIcon;
  size?: number;
  variant?: IconButtonVariant;
  /** @deprecated use variant="ghost" instead */
  ghost?: boolean;
}

const variantStyles: Record<IconButtonVariant, string> = {
  ghost: 'text-text-muted hover:bg-transparent hover:text-text-secondary',
  default: 'text-text-muted hover:bg-bg-mute hover:text-text-secondary',
  filled: 'bg-accent text-text hover:bg-accent-hover'
};

function IconButton({
  icon: Icon,
  size = 14,
  variant,
  ghost = false,
  disabled = false,
  className,
  ...props
}: IconButtonProps): React.JSX.Element {
  const resolved = variant ?? (ghost ? 'ghost' : 'default');

  return (
    <Button
      variant="ghost"
      size={resolved === 'ghost' ? 'icon-sm' : 'icon'}
      disabled={disabled}
      className={cn(variantStyles[resolved], disabled && 'cursor-default', className)}
      {...props}
    >
      <Icon size={size} />
    </Button>
  );
}

export default IconButton;
