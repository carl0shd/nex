import { memo, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import IconButton from '@/components/ui/icon-button';

interface NotesPanelProps {
  sessionId: string;
  onClose?: () => void;
}

const SAVE_DEBOUNCE_MS = 400;

function NotesPanel({ sessionId, onClose }: NotesPanelProps): React.JSX.Element {
  const [value, setValue] = useState('');
  const loadedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValue = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadedRef.current = false;
    window.api.readSessionNotes(sessionId).then((content) => {
      if (cancelled) return;
      setValue(content);
      loadedRef.current = true;
    });
    return () => {
      cancelled = true;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      if (pendingValue.current !== null) {
        window.api.writeSessionNotes(sessionId, pendingValue.current);
        pendingValue.current = null;
      }
    };
  }, [sessionId]);

  const flushSave = (): void => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (pendingValue.current !== null) {
      window.api.writeSessionNotes(sessionId, pendingValue.current);
      pendingValue.current = null;
    }
  };

  const handleChange = (next: string): void => {
    setValue(next);
    if (!loadedRef.current) return;
    pendingValue.current = next;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (pendingValue.current !== null) {
        window.api.writeSessionNotes(sessionId, pendingValue.current);
        pendingValue.current = null;
      }
      saveTimer.current = null;
    }, SAVE_DEBOUNCE_MS);
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border-soft bg-bg-soft px-2.5 py-1.5">
        <span className="text-[11px] text-text-muted">{'// notes'}</span>
        <IconButton icon={X} size={10} ghost onClick={onClose} />
      </div>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={flushSave}
        spellCheck={false}
        className="min-h-0 flex-1 resize-none bg-bg-notes p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary outline-none"
      />
    </div>
  );
}

export default memo(NotesPanel);
