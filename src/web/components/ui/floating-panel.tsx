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
        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-bg-panel py-1 pr-1.5 pl-2.5 shadow-popover">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex cursor-pointer items-center gap-2 select-none"
          >
            <ChevronUp size={13} className="shrink-0 text-text-muted" />
            <span className="text-[11px] text-text-secondary">{label}</span>
          </button>
          {collapsedAction}
        </div>
      ) : (
        <div
          className={cn(
            'pointer-events-auto flex w-full max-w-3xl flex-col gap-2 rounded-lg border border-border bg-bg-panel p-2 shadow-popover',
            className
          )}
        >
          {foldable && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 select-none hover:bg-bg-hover"
            >
              <ChevronDown size={13} className="shrink-0 text-text-muted" />
              <span className="text-[11px] text-text-secondary">{label}</span>
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

export default FloatingPanel;
