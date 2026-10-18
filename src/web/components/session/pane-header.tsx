import { X } from 'lucide-react';
import IconButton from '@/components/ui/icon-button';

interface PaneHeaderProps {
  title: string;
  onTitleClick?: () => void;
  onClose?: () => void;
  trailing?: React.ReactNode;
}

function PaneHeader({
  title,
  onTitleClick,
  onClose,
  trailing
}: PaneHeaderProps): React.JSX.Element {
  return (
    <div className="flex h-8 shrink-0 items-center justify-between gap-1 border-b border-line-soft pr-1 pl-3">
      <button
        type="button"
        onClick={onTitleClick}
        disabled={!onTitleClick}
        className="eyebrow interactive outline-none select-none enabled:cursor-pointer enabled:hover:text-ink"
      >
        {title}
      </button>
      <div className="flex items-center gap-1">
        {trailing}
        {onClose && (
          <IconButton icon={X} size={12} onClick={onClose} className="size-6" title="Hide" />
        )}
      </div>
    </div>
  );
}

export default PaneHeader;
