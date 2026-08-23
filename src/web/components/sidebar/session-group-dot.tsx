import { memo } from 'react';
import StatusDot from '@/components/ui/status-dot';
import { useSessionsStatus } from '@/hooks/use-session-status';

interface SessionGroupDotProps {
  sessionIds: string[];
}

// Rolls the sessions hidden inside a collapsed group up onto its label, so an
// agent waiting on the user is never folded out of sight.
function SessionGroupDot({ sessionIds }: SessionGroupDotProps): React.JSX.Element | null {
  const status = useSessionsStatus(sessionIds);
  if (!status || status === 'idle') return null;
  return <StatusDot status={status} className="size-1.5" />;
}

export default memo(SessionGroupDot);
