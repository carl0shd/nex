import type { LucideIcon } from 'lucide-react';

type IconButtonVariant = 'ghost' | 'default' | 'filled';

interface IconButtonProps {
  icon: LucideIcon;
  size?: number;
  variant?: IconButtonVariant;
  /** @deprecated use variant="ghost" instead */
  ghost?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

const variantStyles: Record<IconButtonVariant, string> = {
  ghost: 'p-1 text-text-muted hover:text-text-secondary',
  default: 'p-1.5 text-text-muted hover:bg-bg-mute hover:text-text-secondary',
  filled: 'p-1.5 bg-accent text-text hover:bg-accent-hover'
};

function IconButton({
  icon: Icon,
  size = 14,
  variant,
  ghost = false,
  onClick,
  className = ''
}: IconButtonProps): React.JSX.Element {
  const resolved = variant ?? (ghost ? 'ghost' : 'default');
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center rounded-md ${variantStyles[resolved]} ${className}`}
    >
      <Icon size={size} />
    </button>
  );
}

export default IconButton;
