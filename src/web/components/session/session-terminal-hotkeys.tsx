import { useHotkey } from '@tanstack/react-hotkeys';
import { useSessionStore } from '@/stores/session.store';
import { useTerminalStore } from '@/stores/terminal.store';

function switchToTerminal(index: number): void {
  const activeSessionId = useSessionStore.getState().activeSessionId;
  if (!activeSessionId) return;
  const list = useTerminalStore
    .getState()
    .terminals.filter((t) => t.sessionId === activeSessionId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const target = list[index];
  if (!target) return;
  useTerminalStore.getState().setActive(activeSessionId, target.id);
}

function closeActiveTerminal(): void {
  const activeSessionId = useSessionStore.getState().activeSessionId;
  if (!activeSessionId) return;
  const activeTerminalId = useTerminalStore.getState().activeBySession[activeSessionId];
  if (activeTerminalId) {
    void useTerminalStore.getState().deleteTerminal(activeTerminalId);
    return;
  }
  useSessionStore.getState().requestCloseSession(activeSessionId);
}

function SessionTerminalHotkeys(): null {
  useHotkey('Mod+1', () => switchToTerminal(0));
  useHotkey('Mod+2', () => switchToTerminal(1));
  useHotkey('Mod+3', () => switchToTerminal(2));
  useHotkey('Mod+4', () => switchToTerminal(3));
  useHotkey('Mod+5', () => switchToTerminal(4));
  useHotkey('Mod+6', () => switchToTerminal(5));
  useHotkey('Mod+7', () => switchToTerminal(6));
  useHotkey('Mod+8', () => switchToTerminal(7));
  useHotkey('Mod+9', () => switchToTerminal(8));
  useHotkey('Mod+W', closeActiveTerminal);
  return null;
}

export default SessionTerminalHotkeys;
