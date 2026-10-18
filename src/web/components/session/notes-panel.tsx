import { memo, useEffect, useRef, useState } from 'react';
import PaneHeader from '@/components/session/pane-header';

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
      <PaneHeader title="Notes" onClose={onClose} />
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={flushSave}
        spellCheck={false}
        placeholder="Notes for this task…"
        className="min-h-0 flex-1 resize-none bg-transparent px-3 py-2.5 font-mono text-2xs leading-relaxed text-ink-2 outline-none placeholder:text-ink-4 select-text"
      />
    </div>
  );
}

export default memo(NotesPanel);
