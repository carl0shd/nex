import type { LucideIcon } from 'lucide-react';

type IconButtonVariant = 'ghost' | 'default' | 'filled';

interface IconButtonProps {
  icon: LucideIcon;
  size?: number;
  variant?: IconButtonVariant;
  /** @deprecated use variant="ghost" instead */
  ghost?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
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
  disabled = false,
  className = ''
}: IconButtonProps): React.JSX.Element {
  const resolved = variant ?? (ghost ? 'ghost' : 'default');
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center rounded-md ${variantStyles[resolved]} ${disabled ? 'cursor-default opacity-40' : 'cursor-pointer'} ${className}`}
    >
      <Icon size={size} />
    </button>
  );
}

export default IconButton;
