import type { Worktree } from '@/lib/worktree';
import WorktreeHeader from '@/components/worktree/worktree-header';
import ChangedFilesPanel from '@/components/worktree/changed-files-panel';
import NotesPanel from '@/components/worktree/notes-panel';
import TabBar from '@/components/worktree/tab-bar';
import TerminalInput from '@/components/worktree/terminal-input';

interface WorktreePanelProps {
  worktree: Worktree;
}

function WorktreePanel({ worktree }: WorktreePanelProps): React.JSX.Element {
  return (
    <div
      className={`flex w-150 shrink-0 flex-col overflow-hidden rounded-lg border border-border-soft ${worktree.active ? 'opacity-100' : 'opacity-50'}`}
    >
      <WorktreeHeader worktree={worktree} />

      <div className="flex border-border-soft" style={{ height: 200 }}>
        <ChangedFilesPanel worktree={worktree} />
        <NotesPanel content={worktree.notes} />
      </div>

      <div className="flex flex-1 flex-col bg-bg-card">
        <TabBar
          tabs={worktree.tabs}
          commands={worktree.commands}
          commandOverflowCount={worktree.commandOverflowCount}
        />
        <div className="flex flex-1 flex-col p-3.5 pt-3">
          <div className="flex-1" />
          <TerminalInput placeholder={worktree.inputPlaceholder} />
        </div>
      </div>
    </div>
  );
}

export default WorktreePanel;
