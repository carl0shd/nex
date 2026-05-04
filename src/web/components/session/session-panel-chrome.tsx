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
import { useSessionStore } from '@/stores/session.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import SessionHeader from '@/components/session/session-header';
import ChangedFilesPanel from '@/components/session/changed-files-panel';
import NotesPanel from '@/components/session/notes-panel';
import TabBar from '@/components/session/tab-bar';
import TerminalInput from '@/components/session/terminal-input';
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
}

const EMPTY_FILES: never[] = [];

function SessionPanelChrome({
  sessionId,
  containerRef,
  containerStyle,
  extraClassName = '',
  dragRef,
  dragAttributes,
  dragListeners
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
  const workspace = useWorkspaceStore((s) =>
    project ? s.workspaces.find((w) => w.id === project.workspaceId) : undefined
  );
  const projectName = project?.name ?? '';
  const dotColor = workspace?.color ?? 'var(--nex-text-muted)';
  const projectQuickCommands = project?.quickCommands;
  const commands = useMemo<QuickCommand[]>(
    () => (projectQuickCommands ?? []).map((c) => ({ label: c.name })),
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

  const verticalDefault = topVisible && verticalLayout ? verticalLayout : undefined;
  const horizontalDefault =
    diffVisible && notesVisible && horizontalLayout ? horizontalLayout : undefined;

  const tabs = useMemo<SessionTab[]>(() => [{ name, dotColor, active: true }], [name, dotColor]);

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={`relative flex h-full w-150 shrink-0 flex-col overflow-hidden rounded-lg border border-border-soft bg-bg ${extraClassName}`}
    >
      <SessionHeader
        branch={branch || name}
        projectName={projectName}
        dotColor={dotColor}
        onClose={openCloseModal}
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
            <Panel id="top" defaultSize="28%" minSize="12%">
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

        <Panel id="bottom" defaultSize="72%" minSize="25%">
          <div className="flex h-full flex-col bg-bg-chat">
            <TabBar tabs={tabs} commands={commands} />
            <div className="flex flex-1 flex-col p-3.5 pt-3">
              <div className="flex-1" />
              <TerminalInput
                placeholder="Ask the agent…"
                diffVisible={diffVisible}
                notesVisible={notesVisible}
                onToggleDiff={toggleDiff}
                onToggleNotes={toggleNotes}
              />
            </div>
          </div>
        </Panel>
      </Group>

      <CloseSessionModal open={closeModalOpen} sessionId={sessionId} onClose={dismissCloseModal} />
    </div>
  );
}

export default memo(SessionPanelChrome);
