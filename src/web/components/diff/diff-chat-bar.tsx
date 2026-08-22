import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { DiffSnippet } from '@/stores/diff-chat.store';
import TerminalInput from '@/components/session/terminal-input';
import DiffSnippetCard from '@/components/diff/diff-snippet-card';
import FloatingPanel from '@/components/ui/floating-panel';
import IconButton from '@/components/ui/icon-button';

export interface PendingSelection {
  file: string;
  start: number;
  end: number;
  side: 'additions' | 'deletions';
  code?: string;
}

interface DiffChatBarProps {
  snippets: DiffSnippet[];
  pending: PendingSelection | null;
  worktreePath?: string;
  agentName: string | null;
  onAddPending: () => void;
  onRemoveSnippet: (id: string) => void;
  onSubmit: (text: string) => void;
}

function DiffChatBar({
  snippets,
  pending,
  worktreePath,
  agentName,
  onAddPending,
  onRemoveSnippet,
  onSubmit
}: DiffChatBarProps): React.JSX.Element | null {
  // Never goes stale: snippets can only be removed from the expanded panel, and
  // sending navigates away, so the batch is always empty with the panel open.
  const [collapsed, setCollapsed] = useState(false);

  if (snippets.length === 0 && !pending) return null;

  const pendingName = pending?.file.slice(pending.file.lastIndexOf('/') + 1);
  const label = `${snippets.length} ${snippets.length === 1 ? 'snippet' : 'snippets'}`;

  return (
    <FloatingPanel
      collapsed={collapsed}
      label={label}
      onToggleCollapse={snippets.length > 0 ? () => setCollapsed((value) => !value) : undefined}
      collapsedAction={
        pending && (
          <IconButton
            icon={Plus}
            size={13}
            onClick={onAddPending}
            title={`Add ${pendingName} ${pending.start}-${pending.end}`}
          />
        )
      }
    >
      {pending && (
        <button
          type="button"
          onClick={onAddPending}
          className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-left select-none hover:bg-bg-hover"
        >
          <Plus size={12} className="shrink-0 text-text-muted" />
          <span className="truncate font-mono text-[11px] text-text-secondary">{pendingName}</span>
          <span className="shrink-0 font-mono text-[10px] text-text-muted">
            {pending.start}-{pending.end}
          </span>
          <span className="flex-1" />
          <span className="shrink-0 text-[11px] text-text-muted">add to chat</span>
        </button>
      )}

      {snippets.length > 0 && (
        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
          {snippets.map((snippet) => (
            <DiffSnippetCard key={snippet.id} snippet={snippet} onRemove={onRemoveSnippet} />
          ))}
        </div>
      )}

      {snippets.length > 0 && (
        <>
          <TerminalInput
            worktreePath={worktreePath}
            placeholder="Type a message / @ to reference"
            notesVisible
            diffVisible
            onSubmit={onSubmit}
          />
          {!agentName && (
            <span className="px-1 text-[10px] text-text-muted">
              Open an agent tab in this session to send.
            </span>
          )}
        </>
      )}
    </FloatingPanel>
  );
}

export default DiffChatBar;
