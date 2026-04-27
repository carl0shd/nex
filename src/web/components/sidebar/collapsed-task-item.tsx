import { GitBranch } from 'lucide-react';
import HoverCard from '@/components/ui/hover-card';
import WorkspaceBadge from '@/components/ui/workspace-badge';
import Badge from '@/components/ui/badge';
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
    <HoverCard
      content={
        <div className="flex w-44 flex-col gap-1 rounded-lg border border-border-menu bg-bg-menu px-3 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-1.5">
            <GitBranch size={12} className="shrink-0 text-text-muted" />
            <span className="truncate text-[12px] font-semibold text-text">{session.name}</span>
            <span className="flex-1" />
            {isActive && <Badge label="active" variant="success" size="sm" />}
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
        </div>
      }
    >
      <button
        onClick={onClick}
        className="group relative flex size-8 cursor-pointer items-center justify-center rounded-md select-none hover:bg-bg-mute"
      >
        <GitBranch size={16} className="text-text-muted group-hover:text-text" />
      </button>
    </HoverCard>
  );
}

export default CollapsedTaskItem;
