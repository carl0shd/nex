import { useHotkey } from '@tanstack/react-hotkeys';
import { useSessionStore } from '@/stores/session.store';

function focusSessionByIndex(index: number): void {
  const sessions = useSessionStore.getState().sessions.filter((s) => s.status === 'active');
  const target = sessions[index];
  if (!target) return;
  useSessionStore.getState().focusSession(target.id);
}

function SessionHotkeys(): null {
  useHotkey('Control+1', () => focusSessionByIndex(0));
  useHotkey('Control+2', () => focusSessionByIndex(1));
  useHotkey('Control+3', () => focusSessionByIndex(2));
  useHotkey('Control+4', () => focusSessionByIndex(3));
  useHotkey('Control+5', () => focusSessionByIndex(4));
  useHotkey('Control+6', () => focusSessionByIndex(5));
  useHotkey('Control+7', () => focusSessionByIndex(6));
  useHotkey('Control+8', () => focusSessionByIndex(7));
  useHotkey('Control+9', () => focusSessionByIndex(8));
  return null;
}

export default SessionHotkeys;
