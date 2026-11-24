import { useEffect, useRef } from "react";
import { EditorContent, Extension, useEditor, type Editor } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { LinkPillNode, pasteLinks, TypedLinkToPill } from "@/components/composer/link-pill-node";
import { cn } from "@/lib/utils";

function plainText(editor: Editor) {
  return editor
    .getText({
      blockSeparator: "\n",
      textSerializers: { linkPill: ({ node }) => String(node.attrs.url) },
    })
    .trim();
}

const placeholders = new WeakMap<Editor, string>();

const VARIANT = {
  details: "details-editor max-h-48 text-base leading-[22px] text-ink-3",
  prompt: "max-h-40 text-lg leading-7 text-ink",
};

export function DetailsEditor({
  placeholder,
  label = "Details",
  variant = "details",
  autoFocus = false,
  onChange,
  onSubmit,
  onFiles,
  disabled = false,
  className,
}: {
  placeholder: string;
  label?: string;
  variant?: keyof typeof VARIANT;
  autoFocus?: boolean;
  onChange: (text: string) => void;
  onSubmit?: () => void;
  onFiles?: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const latest = useRef({ onChange, onSubmit, onFiles });
  useEffect(() => {
    latest.current = { onChange, onSubmit, onFiles };
  });

  const editor = useEditor({
    autofocus: autoFocus ? "end" : false,
    extensions: [
      Document,
      Paragraph,
      Text,
      HardBreak,
      Placeholder.configure({ placeholder: ({ editor }) => placeholders.get(editor) ?? "" }),
      LinkPillNode,
      TypedLinkToPill,
      Extension.create({
        name: "submitOnEnter",
        addKeyboardShortcuts: () => ({
          Enter: () => {
            if (!latest.current.onSubmit) return false;
            latest.current.onSubmit();
            return true;
          },
        }),
      }),
    ],
    editorProps: {
      attributes: { "aria-label": label },
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []);
        if (files.length && latest.current.onFiles) {
          latest.current.onFiles(files);
          return true;
        }
        return pasteLinks(view, event.clipboardData?.getData("text/plain") ?? "");
      },
    },
    onUpdate: ({ editor: current }) => latest.current.onChange(plainText(current)),
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    placeholders.set(editor, placeholder);
    editor.view.dispatch(editor.state.tr);
  }, [editor, placeholder]);

  return (
    <EditorContent
      editor={editor}
      className={cn(
        "composer-editor overflow-y-auto",
        VARIANT[variant],
        disabled && "opacity-60",
        className,
      )}
    />
  );
}
