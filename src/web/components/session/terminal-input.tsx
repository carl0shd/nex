import { memo } from 'react';
import { Eye, EyeOff, Paperclip, Mic, ArrowUp } from 'lucide-react';
import IconButton from '@/components/ui/icon-button';

interface TerminalInputProps {
  placeholder?: string;
  notesVisible?: boolean;
  diffVisible?: boolean;
  onToggleNotes?: () => void;
  onToggleDiff?: () => void;
}

function TerminalInput({
  placeholder = '> type a message...',
  notesVisible = true,
  diffVisible = true,
  onToggleNotes,
  onToggleDiff
}: TerminalInputProps): React.JSX.Element {
  const NotesIcon = notesVisible ? Eye : EyeOff;
  const DiffIcon = diffVisible ? Eye : EyeOff;
  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <div className="flex items-center justify-end gap-2 px-2 py-1">
        <button
          onClick={onToggleNotes}
          className="flex cursor-pointer items-center gap-1.5 text-text-muted select-none hover:text-text-secondary"
        >
          <NotesIcon size={11} />
          <span className="text-[10px]">Notes</span>
        </button>
        <span className="h-2.5 w-px bg-border-soft" />
        <button
          onClick={onToggleDiff}
          className="flex cursor-pointer items-center gap-1.5 text-text-muted select-none hover:text-text-secondary"
        >
          <DiffIcon size={11} />
          <span className="text-[10px]">Diff</span>
        </button>
      </div>

      <div className="rounded-lg border border-border-soft bg-bg-chat-input hover:border-border">
        <div className="h-15 py-2.5 pl-3 pr-1">
          <textarea
            placeholder={placeholder}
            className="size-full resize-none overflow-y-auto bg-transparent font-mono text-[12px] text-text-secondary outline-none placeholder:text-text-muted"
          />
        </div>
        <div className="flex items-center gap-2 border-t border-border-soft px-2.5 pr-2 py-1.5">
          <IconButton icon={Paperclip} size={14} ghost />
          <span className="flex-1" />
          <IconButton icon={Mic} size={14} ghost />
          <IconButton icon={ArrowUp} size={14} variant="filled" />
        </div>
      </div>
    </div>
  );
}

export default memo(TerminalInput);
