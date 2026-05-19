import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type KeyboardEvent
} from 'react';
import {
  useEditor,
  EditorContent,
  ReactRenderer,
  ReactNodeViewRenderer,
  NodeViewWrapper,
  Extension,
  Mark,
  mergeAttributes,
  type Editor,
  type NodeViewProps
} from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import HardBreak from '@tiptap/extension-hard-break';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import tippy, { type Instance as TippyInstance, type GetReferenceClientRect } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { Folder, FileCode } from 'lucide-react';
import { useWorktreeFilesStore } from '@/stores/worktree-files.store';
import MentionList, { type MentionListHandle, type MentionItem } from './mention-list';

interface MentionAttrs {
  kind: 'file' | 'folder';
  label: string;
}

function mentionAttrs(attrs: Record<string, unknown>): MentionAttrs {
  return {
    kind: (attrs.kind as 'file' | 'folder' | undefined) ?? 'file',
    label: (attrs.label as string | undefined) ?? (attrs.id as string | undefined) ?? ''
  };
}

function MentionChip({ node }: NodeViewProps): React.JSX.Element {
  const { kind, label } = mentionAttrs(node.attrs);
  const Icon = kind === 'folder' ? Folder : FileCode;
  return (
    <NodeViewWrapper as="span" className="nex-mention" data-kind={kind}>
      <Icon size={11} className="nex-mention-icon" />
      <span>@{label}</span>
    </NodeViewWrapper>
  );
}

/**
 * Inline mark used to render live (interim) speech transcription as muted +
 * italic text. The mark is stripped once the partial is committed as final.
 */
const InterimMark = Mark.create({
  name: 'interim',
  inclusive: true,
  parseHTML() {
    return [{ tag: 'span.nex-interim' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'nex-interim' }), 0];
  }
});

function findInterimRange(editor: Editor): { from: number; to: number } | null {
  let from = -1;
  let to = -1;
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText) return;
    const hasInterim = node.marks.some((m) => m.type.name === 'interim');
    if (hasInterim) {
      if (from === -1) from = pos;
      to = pos + node.nodeSize;
    }
  });
  return from === -1 ? null : { from, to };
}

const MentionWithIcon = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      kind: {
        default: 'file',
        parseHTML: (el) => el.getAttribute('data-kind') ?? 'file',
        renderHTML: (attrs) => (attrs.kind ? { 'data-kind': attrs.kind } : {})
      }
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(MentionChip);
  }
});

export interface ChatEditorHandle {
  focus: () => void;
  clear: () => void;
  isEmpty: () => boolean;
  submit: () => void;
  insertText: (text: string) => void;
  /** Replace any current interim span with `text` (or clear if empty). */
  setInterimText: (text: string) => void;
  /** Remove any current interim span from the doc. */
  clearInterim: () => void;
}

interface ChatEditorProps {
  worktreePath?: string;
  placeholder?: string;
  onChange?: (isEmpty: boolean) => void;
  onSubmit?: (text: string) => void;
  onForwardKey?: (data: string) => void;
}

const ARROW_ESCAPE: Record<string, string> = {
  ArrowUp: '\x1b[A',
  ArrowDown: '\x1b[B',
  ArrowRight: '\x1b[C',
  ArrowLeft: '\x1b[D'
};

function serializeEditorText(editor: Editor): string {
  return editor.getText({
    blockSeparator: '\n',
    textSerializers: {
      mention: ({ node }) => `@${mentionAttrs(node.attrs).label}`
    }
  });
}

function flushSubmit(editor: Editor, onSubmit: ((text: string) => void) | undefined): boolean {
  // Drop any uncommitted interim transcription before submitting.
  const interim = findInterimRange(editor);
  if (interim) editor.chain().deleteRange(interim).run();
  const text = serializeEditorText(editor).trim();
  if (!text) return false;
  onSubmit?.(text);
  editor.commands.clearContent(true);
  return true;
}

function filterEntries(entries: MentionItem[], query: string): MentionItem[] {
  if (!query) return entries.slice(0, 50);
  const q = query.toLowerCase();
  const matches: Array<{ item: MentionItem; score: number }> = [];
  for (const item of entries) {
    const lower = item.path.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) continue;
    const name = item.path.split('/').pop() ?? item.path;
    const nameIdx = name.toLowerCase().indexOf(q);
    const score = (nameIdx === 0 ? 0 : nameIdx === -1 ? 1000 : 100 + nameIdx) + idx;
    matches.push({ item, score });
  }
  matches.sort((a, b) => a.score - b.score);
  return matches.slice(0, 50).map((m) => m.item);
}

const ChatEditor = forwardRef<ChatEditorHandle, ChatEditorProps>(
  (
    { worktreePath, placeholder = '> type a message...', onChange, onSubmit, onForwardKey },
    ref
  ): React.JSX.Element => {
    const load = useWorktreeFilesStore((s) => s.load);

    useEffect(() => {
      if (!worktreePath) return;
      void load(worktreePath);
    }, [worktreePath, load]);

    const onSubmitRef = useRef(onSubmit);
    const onChangeRef = useRef(onChange);
    const worktreePathRef = useRef(worktreePath);
    useEffect(() => {
      onSubmitRef.current = onSubmit;
      onChangeRef.current = onChange;
      worktreePathRef.current = worktreePath;
    }, [onSubmit, onChange, worktreePath]);

    const submitExtension = useMemo(
      () =>
        Extension.create({
          name: 'submitOnEnter',
          addKeyboardShortcuts() {
            return {
              Enter: () => {
                flushSubmit(this.editor, onSubmitRef.current);
                return true;
              },
              'Shift-Enter': () => this.editor.commands.setHardBreak()
            };
          }
        }),
      []
    );

    const extensions = useMemo(
      () => [
        Document,
        Paragraph,
        Text,
        HardBreak,
        InterimMark,
        Placeholder.configure({ placeholder }),
        submitExtension,
        MentionWithIcon.configure({
          HTMLAttributes: { class: 'nex-mention' },
          renderText: ({ node }) => `@${mentionAttrs(node.attrs).label}`,
          suggestion: {
            char: '@',
            items: ({ query }) => {
              const path = worktreePathRef.current;
              const entries = path ? (useWorktreeFilesStore.getState().cache[path] ?? []) : [];
              return filterEntries(entries, query);
            },
            render: () => {
              let component: ReactRenderer<MentionListHandle> | null = null;
              let popup: TippyInstance | null = null;

              return {
                onStart: (props: SuggestionProps<MentionItem>) => {
                  component = new ReactRenderer(MentionList, {
                    props: { items: props.items, command: props.command },
                    editor: props.editor
                  });
                  if (!props.clientRect) return;
                  popup = tippy(document.body, {
                    getReferenceClientRect: props.clientRect as GetReferenceClientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'top-start',
                    arrow: false,
                    offset: [0, 8],
                    theme: 'transparent'
                  });
                },
                onUpdate: (props: SuggestionProps<MentionItem>) => {
                  component?.updateProps({ items: props.items, command: props.command });
                  if (!props.clientRect || !popup) return;
                  popup.setProps({
                    getReferenceClientRect: props.clientRect as GetReferenceClientRect
                  });
                },
                onKeyDown: (props: SuggestionKeyDownProps) => {
                  if (props.event.key === 'Escape') {
                    props.event.preventDefault();
                    popup?.hide();
                    return true;
                  }
                  const handled = component?.ref?.onKeyDown(props.event) ?? false;
                  if (handled) props.event.preventDefault();
                  return handled;
                },
                onExit: () => {
                  popup?.destroy();
                  component?.destroy();
                  popup = null;
                  component = null;
                }
              };
            }
          }
        })
      ],
      [placeholder, submitExtension]
    );

    const editor = useEditor({
      extensions,
      editorProps: {
        attributes: {
          class:
            'size-full cursor-text overflow-y-auto bg-transparent font-mono text-[12px] text-text-secondary outline-none'
        }
      },
      onUpdate: ({ editor: ed }) => {
        onChangeRef.current?.(ed.isEmpty);
      }
    });

    const submitNow = useCallback((): void => {
      if (!editor) return;
      flushSubmit(editor, onSubmitRef.current);
    }, [editor]);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => editor?.commands.focus(),
        clear: () => editor?.commands.clearContent(true),
        isEmpty: () => editor?.isEmpty ?? true,
        submit: submitNow,
        insertText: (text: string) => {
          if (!editor) return;
          editor.commands.focus('end');
          editor.commands.insertContent(text);
        },
        setInterimText: (text: string) => {
          if (!editor) return;
          const range = findInterimRange(editor);
          if (!text) {
            if (range) editor.chain().deleteRange(range).run();
            return;
          }
          // Append inside the last block (docEnd - 1 sits inside the last paragraph,
          // not after its closing token — avoids creating a stray new paragraph).
          const insertPos = range
            ? range.from
            : Math.max(1, editor.state.doc.content.size - 1);
          // Skip a leading space if there's already trailing whitespace before us,
          // so we don't double-space after user-typed content.
          const before = editor.state.doc.textBetween(0, insertPos, ' ');
          const needsSpace =
            before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
          const prefixed = (needsSpace ? ' ' : '') + text;
          const chain = editor.chain();
          if (range) chain.deleteRange(range);
          chain.insertContentAt(insertPos, {
            type: 'text',
            text: prefixed,
            marks: [{ type: 'interim' }]
          });
          chain.run();
        },
        clearInterim: () => {
          if (!editor) return;
          const range = findInterimRange(editor);
          if (range) editor.chain().deleteRange(range).run();
        }
      }),
      [editor, submitNow]
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>): void => {
        if (!editor) return;
        const escape = ARROW_ESCAPE[e.key];
        if (escape && editor.isEmpty) {
          e.preventDefault();
          onForwardKey?.(escape);
        }
      },
      [editor, onForwardKey]
    );

    return <EditorContent editor={editor} onKeyDown={handleKeyDown} className="h-full w-full" />;
  }
);

ChatEditor.displayName = 'ChatEditor';

export default ChatEditor;
