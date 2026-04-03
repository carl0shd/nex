import type { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  size?: number;
  ghost?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

function IconButton({
  icon: Icon,
  size = 14,
  ghost = false,
  onClick,
  className = ''
}: IconButtonProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center rounded-md text-text-muted hover:text-text-secondary ${ghost ? 'p-1' : 'p-1.5 hover:bg-bg-mute'} ${className}`}
    >
      <Icon size={size} />
    </button>
  );
}

export default IconButton;
