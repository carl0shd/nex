import { useEffect, useMemo, useRef, useState } from "react";
import {
  EditorContent,
  Extension,
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
  useEditor,
  type Editor,
  type JSONContent,
  type NodeViewProps,
} from "@tiptap/react";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import {
  exitSuggestion,
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from "@tiptap/suggestion";
import { CommandPill, FilePill, LinkPill } from "@/components/composer/inline-pill";
import { CommandPicker, FilePicker } from "@/components/composer/pickers";
import {
  commandPickerEntries,
  commandPickerView,
  filePickerEntries,
  filePickerView,
  type FileEntry,
  type SlashCommand,
  type WorktreeFile,
} from "@/lib/composer-pickers";
import { describeLink } from "@/lib/link-preview";

type PickerKind = "file" | "command";

type OpenPicker = { kind: PickerKind; query: string; left: number };

type PickerHandlers = {
  open: (kind: PickerKind, props: SuggestionProps) => void;
  close: (kind: PickerKind) => void;
  keyDown: (kind: PickerKind, props: SuggestionKeyDownProps) => boolean;
};

const PASTED_CARD_LINES = 20;
const PICKER_WIDTH: Record<PickerKind, number> = { file: 380, command: 400 };
const fileKey = new PluginKey("fileMention");
const commandKey = new PluginKey("commandMention");

const attr = (props: NodeViewProps, name: string) => String(props.node.attrs[name] ?? "");

function FileMentionView(props: NodeViewProps) {
  return (
    <NodeViewWrapper as="span">
      <FilePill path={attr(props, "id")} />
    </NodeViewWrapper>
  );
}

function CommandMentionView(props: NodeViewProps) {
  return (
    <NodeViewWrapper as="span">
      <CommandPill name={attr(props, "id")} />
    </NodeViewWrapper>
  );
}

function LinkPillView(props: NodeViewProps) {
  return (
    <NodeViewWrapper as="span">
      <LinkPill url={attr(props, "url")} />
    </NodeViewWrapper>
  );
}

const LinkPillNode = Node.create({
  name: "linkPill",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return { url: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "span[data-link-pill]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-link-pill": "" })];
  },
  renderText({ node }) {
    return String(node.attrs.url);
  },
  addNodeView() {
    return ReactNodeViewRenderer(LinkPillView);
  },
});

function argsHint(args: string) {
  const name = args.replace(/[[\]<>]/g, "");
  return args.startsWith("[") ? `${name} (optional)` : name;
}

const CommandArgsHint = Extension.create({
  name: "commandArgsHint",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const widgets: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (node.type.name !== "commandMention" || !node.attrs.args) return;
              const $after = state.doc.resolve(pos + node.nodeSize);
              const rest = $after.parent.textBetween(
                $after.parentOffset,
                $after.parent.content.size,
              );
              if (rest.trim()) return;
              const hint = document.createElement("span");
              hint.className = "text-ink-4 pointer-events-none";
              hint.textContent = argsHint(String(node.attrs.args));
              widgets.push(Decoration.widget($after.end(), hint, { side: 1 }));
            });
            return DecorationSet.create(state.doc, widgets);
          },
        },
      }),
    ];
  },
});

function serialize(editor: Editor) {
  return editor
    .getText({
      blockSeparator: "\n",
      textSerializers: {
        fileMention: ({ node }) => `@${node.attrs.id}`,
        commandMention: ({ node }) => `/${node.attrs.id}`,
        linkPill: ({ node }) => String(node.attrs.url),
      },
    })
    .trim();
}

function createPickerBridge() {
  let handlers: PickerHandlers = { open: () => {}, close: () => {}, keyDown: () => false };
  return {
    connect(next: PickerHandlers) {
      handlers = next;
    },
    render: (kind: PickerKind) => () => ({
      onStart: (props: SuggestionProps) => handlers.open(kind, props),
      onUpdate: (props: SuggestionProps) => handlers.open(kind, props),
      onExit: () => handlers.close(kind),
      onKeyDown: (props: SuggestionKeyDownProps) => handlers.keyDown(kind, props),
    }),
  };
}

export function RichEditor({
  placeholder,
  defaultContent,
  files = [],
  commands = [],
  onSubmit,
  onAttachFiles,
  onPasteText,
}: {
  placeholder: string;
  defaultContent?: JSONContent;
  files?: readonly WorktreeFile[];
  commands?: readonly SlashCommand[];
  onSubmit?: (text: string) => void;
  onAttachFiles?: (files: File[]) => void;
  onPasteText?: (text: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [picker, setPicker] = useState<OpenPicker | null>(null);
  const [selected, setSelected] = useState(0);
  const suggestion = useRef<SuggestionProps | null>(null);
  const [bridge] = useState(createPickerBridge);
  const callbacks = useRef({ onSubmit, onAttachFiles, onPasteText });
  useEffect(() => {
    callbacks.current = { onSubmit, onAttachFiles, onPasteText };
  });

  const fileView = picker?.kind === "file" ? filePickerView(files, picker.query) : null;
  const commandView = picker?.kind === "command" ? commandPickerView(commands, picker.query) : null;
  const fileEntries = fileView ? filePickerEntries(fileView) : [];
  const commandEntries = commandView ? commandPickerEntries(commandView) : [];
  const count = fileView ? fileEntries.length : commandEntries.length;
  const current = Math.min(selected, Math.max(count - 1, 0));

  const extensions = useMemo(
    () => [
      Document,
      Paragraph,
      Text,
      HardBreak,
      Placeholder.configure({ placeholder }),
      LinkPillNode,
      CommandArgsHint,
      Mention.extend({
        name: "fileMention",
        addNodeView: () => ReactNodeViewRenderer(FileMentionView),
      }).configure({
        suggestion: { char: "@", pluginKey: fileKey, render: bridge.render("file") },
      }),
      Mention.extend({
        name: "commandMention",
        addAttributes() {
          return { ...this.parent?.(), args: { default: null } };
        },
        addNodeView: () => ReactNodeViewRenderer(CommandMentionView),
      }).configure({
        suggestion: {
          char: "/",
          startOfLine: true,
          pluginKey: commandKey,
          render: bridge.render("command"),
        },
      }),
      Extension.create({
        name: "submitOnEnter",
        addKeyboardShortcuts() {
          return {
            Enter: ({ editor }) => {
              const text = serialize(editor);
              if (!text) return true;
              callbacks.current.onSubmit?.(text);
              editor.commands.clearContent(true);
              return true;
            },
            "Shift-Enter": ({ editor }) => editor.commands.setHardBreak(),
          };
        },
      }),
    ],
    [placeholder, bridge],
  );

  const editor = useEditor({
    extensions,
    content: defaultContent,
    editorProps: {
      handlePaste(view: EditorView, event: ClipboardEvent) {
        const data = event.clipboardData;
        if (!data) return false;
        if (data.files.length) {
          callbacks.current.onAttachFiles?.([...data.files]);
          return true;
        }
        const text = data.getData("text/plain");
        const url = text.trim();
        if (!/\s/.test(url) && describeLink(url)) {
          const pill = view.state.schema.nodes.linkPill.create({ url });
          view.dispatch(view.state.tr.replaceSelectionWith(pill).insertText(" "));
          return true;
        }
        if (text.split("\n").length > PASTED_CARD_LINES && callbacks.current.onPasteText) {
          callbacks.current.onPasteText(text);
          return true;
        }
        return false;
      },
      handleDrop(_view: EditorView, event: DragEvent) {
        return Boolean(event.dataTransfer?.files.length);
      },
    },
  });

  const insertFile = (entry: FileEntry) =>
    suggestion.current?.command({ id: entry.path, label: entry.path });

  const replaceQuery = (query: string) => {
    const props = suggestion.current;
    if (!props) return;
    props.editor.chain().focus().insertContentAt(props.range, `@${query}`).run();
  };

  const runCommand = (command: SlashCommand, submit: boolean) => {
    const props = suggestion.current;
    if (!props) return;
    props.command({ id: command.name, label: command.name, args: command.args ?? null });
    if (submit && !command.args) {
      callbacks.current.onSubmit?.(`/${command.name}`);
      props.editor.commands.clearContent(true);
    }
  };

  useEffect(() => {
    bridge.connect({
      open(kind, props) {
        suggestion.current = props;
        const root = rootRef.current?.getBoundingClientRect();
        const caret = props.clientRect?.();
        const width = PICKER_WIDTH[kind];
        const left =
          root && caret
            ? Math.min(Math.max(caret.left - root.left - 14, -6), root.width - width + 6)
            : 0;
        if (picker?.query !== props.query || picker?.kind !== kind) setSelected(0);
        setPicker({ kind, query: props.query, left });
      },
      close(kind) {
        setPicker((previous) => (previous?.kind === kind ? null : previous));
        suggestion.current = null;
      },
      keyDown(kind, { event, view }) {
        if (event.key === "Escape") {
          exitSuggestion(view, kind === "file" ? fileKey : commandKey);
          return true;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          const step = event.key === "ArrowDown" ? 1 : -1;
          setSelected((index) => (Math.min(index, count - 1) + step + count) % Math.max(count, 1));
          return true;
        }
        if (kind === "file" && fileView) {
          const entry = fileEntries[current];
          if (event.key === "Enter" && event.metaKey && fileView.mode === "folder") {
            insertFile({ ...entry, path: fileView.folder });
            return true;
          }
          if (event.key === "Backspace" && fileView.mode === "folder") {
            const parent = fileView.folder.slice(0, -1);
            replaceQuery(parent.includes("/") ? parent.slice(0, parent.lastIndexOf("/") + 1) : "");
            return true;
          }
          if (!entry) return false;
          if (event.key === "Tab" && entry.folder) {
            replaceQuery(entry.path);
            return true;
          }
          if (event.key === "Enter" || event.key === "Tab") {
            insertFile(entry);
            return true;
          }
        }
        if (kind === "command" && commandEntries[current]) {
          if (event.key === "Enter" || event.key === "Tab") {
            runCommand(commandEntries[current], event.key === "Enter");
            return true;
          }
        }
        return false;
      },
    });
  });

  return (
    <div ref={rootRef} className="relative px-3.5 pt-3 pb-1 text-sm leading-6 text-ink">
      <EditorContent editor={editor} className="composer-editor max-h-60 overflow-y-auto" />
      {picker && (
        <div className="absolute bottom-full z-30 mb-2" style={{ left: picker.left }}>
          {fileView && (
            <FilePicker
              view={fileView}
              query={picker.query}
              selected={current}
              onSelect={(entry) => insertFile(entry)}
              onHover={setSelected}
            />
          )}
          {commandView && (
            <CommandPicker
              view={commandView}
              query={picker.query}
              selected={current}
              onSelect={(command) => runCommand(command, false)}
              onHover={setSelected}
            />
          )}
        </div>
      )}
    </div>
  );
}
