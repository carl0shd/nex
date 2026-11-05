import { useEffect, useRef } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
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

export function DetailsEditor({
  placeholder,
  onChange,
  disabled = false,
  className,
}: {
  placeholder: string;
  onChange: (text: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const change = useRef(onChange);
  useEffect(() => {
    change.current = onChange;
  });

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      HardBreak,
      Placeholder.configure({ placeholder }),
      LinkPillNode,
      TypedLinkToPill,
    ],
    editorProps: {
      attributes: { "aria-label": "Details" },
      handlePaste: (view, event) =>
        pasteLinks(view, event.clipboardData?.getData("text/plain") ?? ""),
    },
    onUpdate: ({ editor: current }) => change.current(plainText(current)),
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <EditorContent
      editor={editor}
      className={cn(
        "composer-editor details-editor max-h-48 overflow-y-auto text-base leading-[22px] text-ink-3",
        disabled && "opacity-60",
        className,
      )}
    />
  );
}
