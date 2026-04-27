import SimpleBar from 'simplebar-react';
import SessionPanel from '@/components/session/session-panel';
import type { SessionView } from '@/lib/session-view';

interface SessionViewProps {
  sessions: SessionView[];
}

function SessionView({ sessions }: SessionViewProps): React.JSX.Element {
  return (
    <div className="flex-1 overflow-hidden px-3">
      <SimpleBar className="h-full" autoHide={false} forceVisible="x">
        <div className="flex h-full gap-3 py-3">
          {sessions.map((s) => (
            <SessionPanel key={s.id} session={s} />
          ))}
        </div>
      </SimpleBar>
    </div>
  );
}

export default SessionView;
