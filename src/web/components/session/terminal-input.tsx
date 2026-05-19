import { memo, useCallback, useRef, useState, type Ref } from 'react';
import { ArrowUp, FileText, FileDiff } from 'lucide-react';
import IconButton from '@/components/ui/icon-button';
import { useMergedRef } from '@/hooks/use-merged-ref';
import ChatEditor, { type ChatEditorHandle } from './chat-editor';
import MicButton from './mic-button';

interface TerminalInputProps {
  placeholder?: string;
  notesVisible?: boolean;
  diffVisible?: boolean;
  worktreePath?: string;
  editorRef?: Ref<ChatEditorHandle>;
  onToggleNotes?: () => void;
  onToggleDiff?: () => void;
  onSubmit?: (text: string) => void;
  onForwardKey?: (data: string) => void;
}

function TerminalInput({
  placeholder = '> type a message...',
  notesVisible = true,
  diffVisible = true,
  worktreePath,
  editorRef,
  onToggleNotes,
  onToggleDiff,
  onSubmit,
  onForwardKey
}: TerminalInputProps): React.JSX.Element {
  const [hasText, setHasText] = useState(false);
  const localEditorRef = useRef<ChatEditorHandle | null>(null);
  const setEditorRefs = useMergedRef(localEditorRef, editorRef);

  const handleChange = useCallback((isEmpty: boolean): void => {
    setHasText(!isEmpty);
  }, []);

  const submit = useCallback((): void => {
    localEditorRef.current?.submit();
  }, []);

  const handleTranscript = useCallback((text: string): void => {
    const editor = localEditorRef.current;
    if (!editor) return;
    // Drop any in-flight interim and commit the authoritative final text.
    editor.clearInterim();
    const prefix = editor.isEmpty() ? '' : ' ';
    editor.insertText(prefix + text);
  }, []);

  const handlePartial = useCallback((text: string): void => {
    localEditorRef.current?.setInterimText(text);
  }, []);

  return (
    <div className="shrink-0 rounded-lg border border-border-soft bg-bg-chat-input hover:border-border focus-within:border-border">
      <div className="h-18 py-2.5 pl-3 pr-1">
        <ChatEditor
          ref={setEditorRefs}
          worktreePath={worktreePath}
          placeholder={placeholder}
          onChange={handleChange}
          onSubmit={onSubmit}
          onForwardKey={onForwardKey}
        />
      </div>
      <div className="flex items-center justify-between border-t border-border-soft px-2.5 pr-2 py-1.5">
        <div className="flex items-center gap-0.5">
          {!notesVisible && <IconButton icon={FileText} size={14} onClick={onToggleNotes} />}
          {!diffVisible && <IconButton icon={FileDiff} size={14} onClick={onToggleDiff} />}
        </div>
        <div className="flex items-center gap-1">
          <MicButton onTranscript={handleTranscript} onPartial={handlePartial} />
          <IconButton
            icon={ArrowUp}
            size={14}
            variant="filled"
            disabled={!hasText}
            onClick={submit}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(TerminalInput);
