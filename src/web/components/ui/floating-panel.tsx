import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingPanelProps {
  children: React.ReactNode;
  onToggleCollapse?: () => void;
  collapsed?: boolean;
  label?: string;
  collapsedAction?: React.ReactNode;
  className?: string;
}

function FloatingPanel({
  children,
  onToggleCollapse,
  collapsed = false,
  label,
  collapsedAction,
  className
}: FloatingPanelProps): React.JSX.Element {
  const foldable = onToggleCollapse != null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-3">
      {foldable && collapsed ? (
        <div className="glass pointer-events-auto flex animate-pop-in items-center gap-1 rounded-full py-1 pr-1.5 pl-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="interactive flex cursor-pointer items-center gap-2 text-ink-2 select-none hover:text-ink"
          >
            <ChevronUp size={13} className="shrink-0 text-ink-3" />
            <span className="text-2xs text-ink-2">{label}</span>
          </button>
          {collapsedAction}
        </div>
      ) : (
        <div
          className={cn(
            'glass pointer-events-auto flex w-full max-w-3xl animate-pop-in flex-col gap-2 rounded-panel p-2',
            className
          )}
        >
          {foldable && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="interactive flex cursor-pointer items-center gap-2 rounded-control px-1.5 py-1 select-none hover:bg-hover-2"
            >
              <ChevronDown size={13} className="shrink-0 text-ink-3" />
              <span className="text-2xs text-ink-2">{label}</span>
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

export default FloatingPanel;
