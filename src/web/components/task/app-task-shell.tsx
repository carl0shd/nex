import { NoTerminals } from "@/components/terminal/no-terminals";
import { ShellView } from "@/components/terminal/shell-view";
import { forgetTerminalSnapshot } from "@/lib/terminal-snapshots";
import { useWorkspaceStore } from "@/stores/workspace.store";

export function AppTaskShell({ sessionId, focusId }: { sessionId: string; focusId?: string }) {
  const allTerminals = useWorkspaceStore((s) => s.terminals);
  const addShell = useWorkspaceStore((s) => s.addShell);
  const closeTerminal = useWorkspaceStore((s) => s.closeTerminal);
  const shells = allTerminals.filter(
    (terminal) => terminal.sessionId === sessionId && terminal.type === "shell",
  );

  if (shells.length === 0) return <NoTerminals onNew={() => void addShell(sessionId)} />;
  return (
    <ShellView
      terminals={shells.map((terminal) => ({ id: terminal.id, name: terminal.name }))}
      onNewTerminal={() => void addShell(sessionId)}
      onRestart={(id) => void window.api.ptyKill(id).then(() => window.api.ptyEnsure(id))}
      onStop={(id) => void window.api.ptyKill(id)}
      onClose={(id) => {
        forgetTerminalSnapshot(id);
        void closeTerminal(id);
      }}
      live
      focusId={focusId}
    />
  );
}
