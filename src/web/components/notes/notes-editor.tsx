import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Markdown } from "@tiptap/markdown";
import { FormatToolbar } from "@/components/notes/format-toolbar";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/stores/preferences.store";

export function NotesEditor({
  defaultValue,
  onChange,
  className,
  contentClassName,
}: {
  defaultValue: string;
  onChange?: (markdown: string) => void;
  className?: string;
  contentClassName?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true },
        underline: false,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown,
      Placeholder.configure({ placeholder: "Write notes for this task…" }),
    ],
    content: defaultValue,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: contentClassName ?? "",
        spellcheck: String(usePreferencesStore.getState().prefs.spellcheck),
      },
    },
    onUpdate: ({ editor: current }) => onChange?.(current.getMarkdown()),
  });

  return (
    <div className={cn("notes-editor relative", className)}>
      <EditorContent editor={editor} />
      <BubbleMenu editor={editor} options={{ placement: "top-start", offset: 8 }}>
        <FormatToolbar editor={editor} />
      </BubbleMenu>
    </div>
  );
}
