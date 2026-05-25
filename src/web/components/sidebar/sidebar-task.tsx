import { memo, useRef } from 'react';
import { GitBranch, Ellipsis, Trash2 } from 'lucide-react';
import IconButton from '@/components/ui/icon-button';
import ContextMenu from '@/components/ui/context-menu';

type SidebarTaskStatus = 'active' | 'running';

interface SidebarTaskProps {
  id: string;
  name: string;
  status?: SidebarTaskStatus;
  active?: boolean;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

const statusStyles: Record<SidebarTaskStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-accent/12', text: 'text-badge-success-text' },
  running: { bg: 'bg-bg-mute', text: 'text-badge-warning-text' }
};

function SidebarTask({
  id,
  name,
  status,
  active = false,
  onClick,
  onDelete
}: SidebarTaskProps): React.JSX.Element {
  const rowRef = useRef<HTMLDivElement>(null);
  const style = status ? statusStyles[status] : null;

  return (
    <div
      ref={rowRef}
      onClick={onClick}
      className={`group flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 pl-4.5 text-left select-none ${
        active ? 'bg-bg-mute/50' : 'hover:bg-bg-mute/50'
      }`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <GitBranch size={12} className="shrink-0 text-text-muted" />
        <span className={`truncate text-[12px] ${active ? 'text-text' : 'text-text-muted'}`}>
          {name}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {style && (
          <span
            className={`rounded-xl px-1.5 py-px text-[10px] font-semibold ${style.bg} ${style.text}`}
          >
            {status}
          </span>
        )}
        {onDelete && (
          <div className="opacity-0 group-hover:opacity-100">
            <ContextMenu
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
    </div>
  );
}

export default memo(SidebarTask);
