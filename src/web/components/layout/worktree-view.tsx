import SimpleBar from 'simplebar-react';
import WorktreePanel from '@/components/worktree/worktree-panel';
import type { Worktree } from '@/lib/worktree';

interface WorktreeViewProps {
  worktrees: Worktree[];
}

function WorktreeView({ worktrees }: WorktreeViewProps): React.JSX.Element {
  return (
    <div className="flex-1 overflow-hidden px-3">
      <SimpleBar className="h-full" autoHide={false} forceVisible="x">
        <div className="flex h-full gap-3 py-3">
          {worktrees.map((wt) => (
            <WorktreePanel key={wt.id} worktree={wt} />
          ))}
        </div>
      </SimpleBar>
    </div>
  );
}

export default WorktreeView;
