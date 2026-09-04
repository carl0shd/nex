import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import type { TerminalStatus, Workspace } from '@native/db/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import PanelSection from '@/components/ui/panel-section';
import StatTile from '@/components/ui/stat-tile';
import SessionSummaryRow from '@/components/session/session-summary-row';
import SessionWorkspaceGroup from '@/components/session/session-workspace-group';
import { aggregateTerminalStatus } from '@/lib/status';
import { formatUsd } from '@/lib/usage-format';
import { useSessionStore } from '@/stores/session.store';
import { useTerminalStore } from '@/stores/terminal.store';
import { useUsageStore } from '@/stores/usage.store';
import { useWorkspaceStore } from '@/stores/workspace.store';

interface SessionsPopoverProps {
  children: React.ReactNode;
}

interface SessionRow {
  id: string;
  name: string;
  branch: string;
  projectName: string;
  status: TerminalStatus;
  costUsd: number;
  createdAt: string;
}

interface WorkspaceGroup {
  workspace: Workspace;
  rows: SessionRow[];
  costUsd: number;
}

const STATUS_ORDER: Record<TerminalStatus, number> = { waiting: 0, running: 1, idle: 2 };

const LIST_MAX_HEIGHT = 280;

function byStatusThenAge(a: SessionRow, b: SessionRow): number {
  return STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.createdAt.localeCompare(a.createdAt);
}

function SessionsPopover({ children }: SessionsPopoverProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const sessions = useSessionStore((s) => s.sessions);
  const focusSession = useSessionStore((s) => s.focusSession);
  const terminals = useTerminalStore((s) => s.terminals);
  const projects = useWorkspaceStore((s) => s.projects);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const summary = useUsageStore((s) => s.summary);

  const groups = useMemo<WorkspaceGroup[]>(() => {
    const costBySession = new Map(summary?.sessions.map((s) => [s.sessionId, s.totals.costUsd]));
    const projectById = new Map(projects.map((project) => [project.id, project]));
    const rowsByWorkspace = new Map<string, SessionRow[]>();

    for (const session of sessions) {
      const project = projectById.get(session.projectId);
      if (!project) continue;

      const rows = rowsByWorkspace.get(project.workspaceId) ?? [];
      rows.push({
        id: session.id,
        name: session.name,
        branch: session.branch,
        projectName: project.name,
        status:
          aggregateTerminalStatus(terminals.filter((t) => t.sessionId === session.id)) ?? 'idle',
        costUsd: costBySession.get(session.id) ?? 0,
        createdAt: session.createdAt
      });
      rowsByWorkspace.set(project.workspaceId, rows);
    }

    // A workspace ranks by its most urgent session, so one waiting on input is
    // never buried under workspaces that are only idling.
    return workspaces
      .map((workspace, index) => ({ workspace, index, rows: rowsByWorkspace.get(workspace.id) }))
      .filter((group) => group.rows !== undefined)
      .map((group) => ({
        workspace: group.workspace,
        index: group.index,
        rows: group.rows!.sort(byStatusThenAge),
        costUsd: group.rows!.reduce((sum, row) => sum + row.costUsd, 0)
      }))
      .sort(
        (a, b) =>
          STATUS_ORDER[a.rows[0].status] - STATUS_ORDER[b.rows[0].status] || a.index - b.index
      );
  }, [sessions, terminals, projects, workspaces, summary]);

  const allRows = groups.flatMap((group) => group.rows);
  const counts = {
    running: allRows.filter((row) => row.status === 'running').length,
    waiting: allRows.filter((row) => row.status === 'waiting').length,
    idle: allRows.filter((row) => row.status === 'idle').length
  };
  const totalCost = allRows.reduce((sum, row) => sum + row.costUsd, 0);

  const openSession = (id: string): void => {
    setOpen(false);
    navigate('/');
    focusSession(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="flex w-84 flex-col gap-2 p-2.5">
        <div className="grid grid-cols-3 gap-1">
          <StatTile size="compact" surface="menu" label="Working" value={String(counts.running)} />
          <StatTile size="compact" surface="menu" label="Waiting" value={String(counts.waiting)} />
          <StatTile size="compact" surface="menu" label="Idle" value={String(counts.idle)} />
        </div>

        <PanelSection
          title="Sessions"
          trailing={
            <span className="font-mono text-[11px] text-text-secondary tabular-nums">
              {formatUsd(totalCost)} today
            </span>
          }
        >
          {allRows.length === 0 ? (
            <p className="py-2 text-[11px] text-text-muted">No session open yet.</p>
          ) : (
            <SimpleBar autoHide={false} style={{ maxHeight: LIST_MAX_HEIGHT }}>
              <div className="flex flex-col gap-2">
                {groups.map((group) => (
                  <SessionWorkspaceGroup
                    key={group.workspace.id}
                    name={group.workspace.name}
                    color={group.workspace.color}
                    icon={group.workspace.icon}
                    customImage={group.workspace.customImage}
                    trailing={
                      <span className="font-mono text-[10px] text-text-muted tabular-nums">
                        {formatUsd(group.costUsd)}
                      </span>
                    }
                  >
                    {group.rows.map((row) => (
                      <SessionSummaryRow
                        key={row.id}
                        {...row}
                        onClick={() => openSession(row.id)}
                      />
                    ))}
                  </SessionWorkspaceGroup>
                ))}
              </div>
            </SimpleBar>
          )}
        </PanelSection>
      </PopoverContent>
    </Popover>
  );
}

export default SessionsPopover;
