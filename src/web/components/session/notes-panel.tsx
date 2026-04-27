import { X } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import IconButton from '@/components/ui/icon-button';

interface NotesPanelProps {
  content: string;
  onClose?: () => void;
}

function NotesPanel({ content, onClose }: NotesPanelProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border-soft bg-bg-soft px-2.5 py-1.5">
        <span className="text-[11px] text-text-muted">{'// notes'}</span>
        <IconButton icon={X} size={10} ghost onClick={onClose} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden bg-bg-notes">
        <SimpleBar style={{ maxHeight: '100%', width: '100%' }} autoHide={false}>
          <div className="p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
            {content}
          </div>
        </SimpleBar>
      </div>
    </div>
  );
}

export default NotesPanel;
