import { memo, useCallback, useRef, useState, type Ref } from 'react';
import { ArrowUp, FileText, FileDiff } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    editor.clearInterim();
    const prefix = editor.isEmpty() ? '' : ' ';
    editor.insertText(prefix + text);
  }, []);

  const handlePartial = useCallback((text: string): void => {
    localEditorRef.current?.setInterimText(text);
  }, []);

  return (
    <div className="interactive shrink-0 rounded-panel bg-field shadow-hairline hover:shadow-[0_0_0_1px_var(--line-strong)] focus-within:shadow-[0_0_0_1px_color-mix(in_srgb,var(--ring)_55%,transparent)] focus-within:ring-3 focus-within:ring-ring/12">
      <div className="h-18 py-2.5 pr-1 pl-3.5">
        <ChatEditor
          ref={setEditorRefs}
          worktreePath={worktreePath}
          placeholder={placeholder}
          onChange={handleChange}
          onSubmit={onSubmit}
          onForwardKey={onForwardKey}
        />
      </div>
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="flex items-center gap-0.5">
          {!notesVisible && <IconButton icon={FileText} size={14} onClick={onToggleNotes} />}
          {!diffVisible && <IconButton icon={FileDiff} size={14} onClick={onToggleDiff} />}
        </div>
        <div className="flex items-center gap-1">
          <MicButton onTranscript={handleTranscript} onPartial={handlePartial} />
          <Button size="icon" disabled={!hasText} onClick={submit} title="Send">
            <ArrowUp size={14} strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default memo(TerminalInput);
