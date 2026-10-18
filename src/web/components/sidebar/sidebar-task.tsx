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
  projectName?: string;
  active?: boolean;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

function SidebarTask({
  id,
  name,
  projectName,
  active = false,
  onClick,
  onDelete
}: SidebarTaskProps): React.JSX.Element {
  const rowRef = useRef<HTMLDivElement>(null);
  const status = useSessionStatus(id);

  return (
    <div
      ref={rowRef}
      data-glide-row
      title={projectName ? `${name} · ${projectName}` : name}
      onClick={onClick}
      className={cn(
        'sidebar-row press group relative mx-2 flex h-8 cursor-pointer items-center rounded-control pr-1 pl-2 text-left select-none',
        active && 'bg-surface shadow-btn',
        // Last so it outranks the active fill: a blocked agent is the more urgent of the two.
        status === 'waiting' && 'bg-orange/10'
      )}
    >
      <span className="relative flex size-5 shrink-0 items-center justify-center">
        <GitBranch size={14} className={active ? 'text-ink-2' : 'text-ink-4'} />
        {status && status !== 'idle' && (
          <StatusDot status={status} className="absolute -top-px -right-px size-1.5" />
        )}
      </span>
      <span className="sidebar-copy ml-2 flex min-w-0 flex-1 items-baseline gap-1.5">
        <span className={cn('truncate text-sm', active ? 'font-medium text-ink' : 'text-ink-2')}>
          {name}
        </span>
        {projectName && (
          <span className="shrink-0 truncate text-2xs text-ink-4">{projectName}</span>
        )}
      </span>
      {onDelete && (
        <span className="sidebar-copy">
          <span className="flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <ActionMenu
              rowRef={rowRef}
              trigger={<IconButton icon={Ellipsis} size={13} className="size-6" />}
              actions={[
                {
                  label: 'Delete task',
                  icon: Trash2,
                  onClick: () => onDelete(id),
                  destructive: true
                }
              ]}
            />
          </span>
        </span>
      )}
    </div>
  );
}

export default memo(SidebarTask);
