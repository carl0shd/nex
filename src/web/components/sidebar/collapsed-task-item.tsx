import { memo } from 'react';
import { GitBranch } from 'lucide-react';
import WorkspaceBadge from '@/components/ui/workspace-badge';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import type { Session, Project, Workspace } from '@native/db/types';

interface CollapsedTaskItemProps {
  session: Session;
  project: Project;
  workspace: Workspace;
  onClick?: () => void;
}

function CollapsedTaskItem({
  session,
  project,
  workspace,
  onClick
}: CollapsedTaskItemProps): React.JSX.Element {
  const isActive = session.status === 'active';

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          onClick={onClick}
          className="group relative flex size-8 cursor-pointer items-center justify-center rounded-md select-none hover:bg-bg-mute"
        >
          <GitBranch size={16} className="text-text-muted group-hover:text-text" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="flex w-44 flex-col gap-1 rounded-lg border border-border-menu bg-bg-menu px-3 py-2.5 shadow-[var(--nex-shadow-popover)]">
        <div className="flex items-center gap-1.5">
          <GitBranch size={12} className="shrink-0 text-text-muted" />
          <span className="truncate text-[12px] font-semibold text-text">{session.name}</span>
          <span className="flex-1" />
          {isActive && (
            <Badge variant="success" size="sm">
              active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <WorkspaceBadge
            name={workspace.name}
            color={workspace.color}
            icon={workspace.icon}
            customImage={workspace.customImage}
            size={12}
            fontSize={7}
            rounded="rounded-sm"
          />
          <span className="truncate text-[11px] text-text-muted">{workspace.name}</span>
          <span className="text-[11px] text-text-muted">·</span>
          <span className="truncate text-[11px] text-text-muted">{project.name}</span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export default memo(CollapsedTaskItem);
