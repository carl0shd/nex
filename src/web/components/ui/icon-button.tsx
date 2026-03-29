import type { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  size?: number;
  onClick?: () => void;
  className?: string;
}

function IconButton({
  icon: Icon,
  size = 14,
  onClick,
  className = ''
}: IconButtonProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-mute hover:text-text-secondary ${className}`}
    >
      <Icon size={size} />
    </button>
  );
}

export default IconButton;
