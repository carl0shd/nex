import { memo, useRef } from 'react';
import { GitBranch, Ellipsis, Trash2 } from 'lucide-react';
import IconButton from '@/components/ui/icon-button';
import ActionMenu from '@/components/ui/action-menu';
import StatusDot from '@/components/ui/status-dot';
import { useSessionStatus } from '@/hooks/use-session-status';
import { cn } from '@/lib/utils';

interface SidebarTaskProps {
  id: string;
  name: string;
  active?: boolean;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

function SidebarTask({
  id,
  name,
  active = false,
  onClick,
  onDelete
}: SidebarTaskProps): React.JSX.Element {
  const rowRef = useRef<HTMLDivElement>(null);
  const status = useSessionStatus(id);

  return (
    <div
      ref={rowRef}
      onClick={onClick}
      className={cn(
        'group flex h-7 w-full cursor-pointer items-center gap-2 rounded px-1.5 text-left select-none',
        active ? 'bg-bg-mute/50' : 'hover:bg-bg-mute/50',
        // Last so it outranks the active fill: a blocked agent is the more urgent
        // of the two, and active still reads through the brighter label.
        status === 'waiting' && 'bg-badge-warning-bg-soft'
      )}
    >
      <GitBranch size={12} className="shrink-0 text-text-muted" />
      <span className={cn('truncate text-[12px]', active ? 'text-text' : 'text-text-muted')}>
        {name}
      </span>
      {status && status !== 'idle' && <StatusDot status={status} className="size-1.5 shrink-0" />}
      <span className="flex-1" />
      {onDelete && (
        <div className="opacity-0 group-hover:opacity-100">
          <ActionMenu
            rowRef={rowRef}
            trigger={<IconButton icon={Ellipsis} size={12} />}
            actions={[
              {
                label: 'Delete task',
                icon: Trash2,
                onClick: () => onDelete(id),
                destructive: true
              }
            ]}
          />
        </div>
      )}
    </div>
  );
}

export default memo(SidebarTask);
