import { useShallow } from 'zustand/react/shallow';
import EmptyState from '@/components/layout/empty-state';
import SessionView from '@/components/layout/session-view';
import { useSessionStore } from '@/stores/session.store';

function Home(): React.JSX.Element {
  const activeIds = useSessionStore(
    useShallow((s) => s.sessions.filter((x) => x.status === 'active').map((x) => x.id))
  );

  if (activeIds.length === 0) return <EmptyState />;

  return <SessionView sessionIds={activeIds} />;
}

export default Home;
