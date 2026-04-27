import type { SessionView } from '@/lib/session-view';
import SessionHeader from '@/components/session/session-header';
import ChangedFilesPanel from '@/components/session/changed-files-panel';
import NotesPanel from '@/components/session/notes-panel';
import TabBar from '@/components/session/tab-bar';
import TerminalInput from '@/components/session/terminal-input';

interface SessionPanelProps {
  session: SessionView;
}

function SessionPanel({ session }: SessionPanelProps): React.JSX.Element {
  return (
    <div
      className={`flex w-150 shrink-0 flex-col overflow-hidden rounded-lg border border-border-soft bg-bg ${session.active ? 'opacity-100' : 'opacity-50'}`}
    >
      <SessionHeader session={session} />

      <div className="flex border-border-soft" style={{ height: 200 }}>
        <ChangedFilesPanel session={session} />
        <NotesPanel content={session.notes} />
      </div>

      <div className="flex flex-1 flex-col bg-bg-chat">
        <TabBar
          tabs={session.tabs}
          commands={session.commands}
          commandOverflowCount={session.commandOverflowCount}
        />
        <div className="flex flex-1 flex-col p-3.5 pt-3">
          <div className="flex-1" />
          <TerminalInput placeholder={session.inputPlaceholder} />
        </div>
      </div>
    </div>
  );
}

export default SessionPanel;
