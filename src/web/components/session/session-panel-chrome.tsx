import {
  memo,
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type Ref
} from 'react';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { Group, Panel, type Layout } from 'react-resizable-panels';
import { useShallow } from 'zustand/react/shallow';
import { useResizableWidth } from '@/hooks/use-resizable-width';
import { useSessionStore } from '@/stores/session.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useTerminalStore } from '@/stores/terminal.store';
import { useAgentStore } from '@/stores/agent.store';
import { agentDisplayName } from '@native/agents/agent-display';
import SessionHeader from '@/components/session/session-header';
import ChangedFilesPanel from '@/components/session/changed-files-panel';
import NotesPanel from '@/components/session/notes-panel';
import TabBar from '@/components/session/tab-bar';
import TerminalInput from '@/components/session/terminal-input';
import NoTerminalsEmpty from '@/components/session/no-terminals-empty';
import XtermView from '@/components/ui/xterm-view';
import ResizeHandle from '@/components/ui/resize-handle';
import CloseSessionModal from '@/components/modals/close-session-modal';
import type { SessionTab, QuickCommand } from '@/lib/session-view';

interface SessionPanelChromeProps {
  sessionId: string;
  containerRef?: Ref<HTMLDivElement>;
  containerStyle?: CSSProperties;
  extraClassName?: string;
  dragRef?: Ref<HTMLDivElement>;
  dragAttributes?: HTMLAttributes<HTMLDivElement>;
  dragListeners?: SyntheticListenerMap;
  nearViewport?: boolean;
}

const EMPTY_FILES: never[] = [];
const DEFAULT_SESSION_WIDTH = 600;

function SessionPanelChrome({
  sessionId,
  containerRef,
  containerStyle,
  extraClassName = '',
  dragRef,
  dragAttributes,
  dragListeners,
  nearViewport = true
}: SessionPanelChromeProps): React.JSX.Element {
  const session = useSessionStore((s) => s.sessions.find((x) => x.id === sessionId));
  const updateSession = useSessionStore((s) => s.updateSession);

  const branch = session?.branch ?? '';
  const name = session?.name ?? '';
  const projectId = session?.projectId ?? '';
  const diffVisible = session?.diffVisible ?? true;
  const notesVisible = session?.notesVisible ?? true;
  const verticalLayout = session?.verticalLayout ?? null;
  const horizontalLayout = session?.horizontalLayout ?? null;

  const project = useWorkspaceStore((s) => s.projects.find((p) => p.id === projectId));
  const projectName = project?.name ?? '';
  const projectQuickCommands = project?.quickCommands;
  const commands = useMemo<QuickCommand[]>(
    () => (projectQuickCommands ?? []).map((c) => ({ label: c.name, command: c.command })),
    [projectQuickCommands]
  );

  const topVisible = diffVisible || notesVisible;
  const verticalKey = topVisible ? 'top-bottom' : 'bottom';
  const horizontalKey = `${diffVisible ? 'd' : ''}${notesVisible ? 'n' : ''}`;

  const handleVerticalChanged = useCallback(
    (layout: Layout): void => {
      if (!('top' in layout) || !('bottom' in layout)) return;
      updateSession(sessionId, { verticalLayout: layout });
    },
    [sessionId, updateSession]
  );

  const handleHorizontalChanged = useCallback(
    (layout: Layout): void => {
      if (!('diff' in layout) || !('notes' in layout)) return;
      updateSession(sessionId, { horizontalLayout: layout });
    },
    [sessionId, updateSession]
  );

  const toggleDiff = useCallback((): void => {
    updateSession(sessionId, { diffVisible: !diffVisible });
  }, [sessionId, updateSession, diffVisible]);

  const toggleNotes = useCallback((): void => {
    updateSession(sessionId, { notesVisible: !notesVisible });
  }, [sessionId, updateSession, notesVisible]);

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const openCloseModal = useCallback((): void => setCloseModalOpen(true), []);
  const dismissCloseModal = useCallback((): void => setCloseModalOpen(false), []);

  const worktreePath = session?.worktreePath;
  const handleOpenIDE = useCallback((): void => {
    if (!worktreePath) return;
    void window.api.openInVSCode(worktreePath);
  }, [worktreePath]);

  const verticalDefault = topVisible && verticalLayout ? verticalLayout : undefined;
  const horizontalDefault =
    diffVisible && notesVisible && horizontalLayout ? horizontalLayout : undefined;

  const sessionTerminals = useTerminalStore(
    useShallow((s) => s.terminals.filter((t) => t.sessionId === sessionId))
  );
  const activeTerminalId = useTerminalStore((s) => s.activeBySession[sessionId]);
  const setActiveTerminal = useTerminalStore((s) => s.setActive);
  const createSessionTerminal = useTerminalStore((s) => s.createSessionTerminal);
  const deleteTerminal = useTerminalStore((s) => s.deleteTerminal);

  const agentId = session?.agentId ?? null;
  const agent = useAgentStore((s) => (agentId ? s.agents.find((a) => a.id === agentId) : null));
  const agentLabel = agent ? agentDisplayName(agent.slug, agent.name) : undefined;

  const activeTerminal = sessionTerminals.find((t) => t.id === activeTerminalId);
  const showAgentInput = activeTerminal?.type === 'agent';

  const headerDotColor = 'var(--nex-text-muted)';
  const tabs = useMemo<SessionTab[]>(
    () =>
      sessionTerminals.map((t) => ({
        id: t.id,
        name: t.name,
        dotColor: headerDotColor,
        active: t.id === activeTerminalId
      })),
    [sessionTerminals, activeTerminalId, headerDotColor]
  );

  const handleSelectTab = useCallback(
    (id: string): void => setActiveTerminal(sessionId, id),
    [sessionId, setActiveTerminal]
  );

  const handleAddTab = useCallback((): void => {
    void createSessionTerminal(sessionId, 'shell');
  }, [sessionId, createSessionTerminal]);

  const handleCreateAgentTab = useCallback((): void => {
    void createSessionTerminal(sessionId, 'agent');
  }, [sessionId, createSessionTerminal]);

  const handleRunCommand = useCallback(
    (cmd: QuickCommand): void => {
      void createSessionTerminal(sessionId, 'shell', {
        name: cmd.label,
        runCommand: cmd.command
      });
    },
    [sessionId, createSessionTerminal]
  );

  const handleCloseTab = useCallback(
    (id: string): void => {
      void deleteTerminal(id);
    },
    [deleteTerminal]
  );

  const sessionWidth = session?.width ?? DEFAULT_SESSION_WIDTH;
  const commitWidth = useCallback(
    (width: number) => {
      updateSession(sessionId, { width });
    },
    [sessionId, updateSession]
  );
  const {
    width,
    onPointerDown: onResizeStart,
    isDragging: isResizing
  } = useResizableWidth(sessionWidth, { min: 360, max: 1600, onCommit: commitWidth });

  const handleResizeDoubleClick = useCallback(() => {
    commitWidth(DEFAULT_SESSION_WIDTH);
  }, [commitWidth]);

  const mergedStyle = useMemo<CSSProperties>(
    () => ({ ...containerStyle, width }),
    [containerStyle, width]
  );

  return (
    <div
      ref={containerRef}
      style={mergedStyle}
      className={`relative flex h-full shrink-0 flex-col overflow-hidden rounded-lg border border-border-soft bg-bg ${extraClassName}`}
    >
      <SessionHeader
        branch={branch || name}
        projectName={projectName}
        dotColor={headerDotColor}
        onClose={openCloseModal}
        onOpenIDE={handleOpenIDE}
        dragRef={dragRef}
        dragAttributes={dragAttributes}
        dragListeners={dragListeners}
      />

      <Group
        key={verticalKey}
        orientation="vertical"
        className="flex-1"
        defaultLayout={verticalDefault}
        onLayoutChanged={handleVerticalChanged}
      >
        {topVisible && (
          <>
            <Panel id="top" defaultSize="27%" minSize="12%">
              <Group
                key={horizontalKey}
                orientation="horizontal"
                className="h-full"
                defaultLayout={horizontalDefault}
                onLayoutChanged={handleHorizontalChanged}
              >
                {diffVisible && (
                  <Panel id="diff" defaultSize="50%" minSize="20%">
                    <ChangedFilesPanel
                      files={EMPTY_FILES}
                      totalFiles={0}
                      totalAdded={0}
                      totalRemoved={0}
                      onClose={toggleDiff}
                    />
                  </Panel>
                )}
                {diffVisible && notesVisible && <ResizeHandle direction="horizontal" />}
                {notesVisible && (
                  <Panel id="notes" defaultSize="50%" minSize="20%">
                    <NotesPanel sessionId={sessionId} onClose={toggleNotes} />
                  </Panel>
                )}
              </Group>
            </Panel>
            <ResizeHandle direction="vertical" />
          </>
        )}

        <Panel id="bottom" defaultSize="73%" minSize="25%">
          <div className="flex h-full min-h-0 flex-col bg-bg-chat">
            <TabBar
              tabs={tabs}
              commands={commands}
              agentName={agentLabel}
              agentSlug={agent?.slug}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
              onAddAgentTab={handleCreateAgentTab}
              onAddShellTab={handleAddTab}
              onRunCommand={handleRunCommand}
            />
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-3.5 pt-3">
              <div className="min-h-0 flex-1 overflow-hidden">
                {sessionTerminals.length === 0 ? (
                  <NoTerminalsEmpty
                    agentName={agentLabel}
                    agentSlug={agent?.slug}
                    onCreateAgent={handleCreateAgentTab}
                    onCreateShell={handleAddTab}
                  />
                ) : (
                  nearViewport &&
                  activeTerminalId && (
                    <XtermView key={activeTerminalId} terminalId={activeTerminalId} />
                  )
                )}
              </div>
              {showAgentInput && (
                <TerminalInput
                  placeholder="Ask the agent…"
                  diffVisible={diffVisible}
                  notesVisible={notesVisible}
                  onToggleDiff={toggleDiff}
                  onToggleNotes={toggleNotes}
                />
              )}
            </div>
          </div>
        </Panel>
      </Group>

      <div
        onPointerDown={onResizeStart}
        onDoubleClick={handleResizeDoubleClick}
        className={`absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-accent ${
          isResizing ? 'bg-accent' : ''
        }`}
        aria-hidden
      />

      <CloseSessionModal open={closeModalOpen} sessionId={sessionId} onClose={dismissCloseModal} />
    </div>
  );
}

export default memo(SessionPanelChrome);
