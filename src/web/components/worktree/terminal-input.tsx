import { GitBranch, ChevronDown, Eye, Paperclip, Mic, Send } from 'lucide-react';
import IconButton from '@/components/ui/icon-button';

interface TerminalInputProps {
  placeholder?: string;
}

function TerminalInput({
  placeholder = '> type a message...'
}: TerminalInputProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3 px-2 py-1">
        <button className="group flex cursor-pointer items-center gap-1.5 text-text-muted select-none hover:text-text-secondary">
          <GitBranch size={12} />
          <span className="text-[10px] font-medium">Git Actions</span>
          <ChevronDown size={10} />
        </button>
        <span className="flex-1" />
        <div className="flex items-center gap-2">
          <button className="flex cursor-pointer items-center gap-1.5 text-text-muted select-none hover:text-text-secondary">
            <Eye size={11} />
            <span className="text-[10px]">Notes</span>
          </button>
          <span className="h-2.5 w-px bg-border" />
          <button className="flex cursor-pointer items-center gap-1.5 text-text-muted select-none hover:text-text-secondary">
            <Eye size={11} />
            <span className="text-[10px]">Diff</span>
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-input hover:border-border-strong">
        <div className="h-15 py-2.5 pl-3 pr-1">
          <textarea
            placeholder={placeholder}
            className="size-full resize-none overflow-y-auto bg-transparent font-mono text-[12px] text-text-secondary outline-none placeholder:text-text-muted"
          />
        </div>
        <div className="flex items-center gap-2 border-t border-border px-2.5 pr-2 py-1.5">
          <IconButton icon={Paperclip} size={14} ghost />
          <span className="flex-1" />
          <IconButton icon={Mic} size={14} ghost />
          <button className="flex size-6.5 cursor-pointer items-center justify-center rounded-md bg-accent select-none hover:bg-accent-hover">
            <Send size={12} className="text-text" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TerminalInput;
