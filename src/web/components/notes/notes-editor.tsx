import { useState, type MouseEvent } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Markdown } from "@tiptap/markdown";
import { Plus } from "iconoir-react";
import { FormatToolbar } from "@/components/notes/format-toolbar";
import { cn } from "@/lib/utils";

type HoveredBlock = { top: number; pos: number };

const LIST_ITEMS = new Set(["listItem", "taskItem"]);

function GripGlyph() {
  return (
    <svg width={8} height={12} viewBox="0 0 8 12" aria-hidden className="fill-current">
      <circle cx={2} cy={2} r={1.1} />
      <circle cx={6} cy={2} r={1.1} />
      <circle cx={2} cy={6} r={1.1} />
      <circle cx={6} cy={6} r={1.1} />
      <circle cx={2} cy={10} r={1.1} />
      <circle cx={6} cy={10} r={1.1} />
    </svg>
  );
}

function BlockHandle({
  top,
  onSelect,
  onAdd,
}: {
  top: number;
  onSelect: () => void;
  onAdd: () => void;
}) {
  return (
    <span
      className="absolute left-1.5 flex items-center text-ink-4 transition-[top] duration-150 ease-out-strong"
      style={{ top }}
    >
      <button
        type="button"
        aria-label="Add a block below"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onAdd}
        className="interactive press flex h-5 w-[18px] cursor-pointer items-center justify-center rounded-[5px] select-none hover:bg-hover hover:text-ink-2"
      >
        <Plus width={12} height={12} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        aria-label="Select block"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onSelect}
        className="interactive press flex h-5 w-3.5 cursor-grab items-center justify-center rounded-[5px] bg-hover select-none hover:text-ink-2"
      >
        <GripGlyph />
      </button>
    </span>
  );
}

function blockAt(editor: Editor, target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const block = target.closest(".ProseMirror li, .ProseMirror > *");
  if (!(block instanceof HTMLElement)) return null;
  let top = 0;
  for (let node: HTMLElement | null = block; node && !node.classList.contains("notes-editor");) {
    top += node.offsetTop;
    node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null;
  }
  return { top: top + 1, pos: editor.view.posAtDOM(block, 0) };
}

export function NotesEditor({
  defaultValue,
  onChange,
  className,
}: {
  defaultValue: string;
  onChange?: (markdown: string) => void;
  className?: string;
}) {
  const [hovered, setHovered] = useState<HoveredBlock | null>(null);
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
    onUpdate: ({ editor: current }) => onChange?.(current.getMarkdown()),
  });

  const track = (event: MouseEvent) => {
    const next = blockAt(editor, event.target);
    if (next && (next.pos !== hovered?.pos || next.top !== hovered.top)) setHovered(next);
  };

  const blockRange = (pos: number) => {
    const $pos = editor.state.doc.resolve(pos);
    let depth = 1;
    for (let level = $pos.depth; level > 1; level--) {
      if (LIST_ITEMS.has($pos.node(level).type.name)) {
        depth = level;
        break;
      }
    }
    return {
      before: $pos.before(depth),
      after: $pos.after(depth),
      type: $pos.node(depth).type.name,
    };
  };

  return (
    <div
      onMouseMove={track}
      onMouseLeave={() => setHovered(null)}
      className={cn("notes-editor relative", className)}
    >
      <EditorContent editor={editor} />
      {hovered && (
        <BlockHandle
          top={hovered.top}
          onAdd={() => {
            const { after, type } = blockRange(hovered.pos);
            const block = LIST_ITEMS.has(type)
              ? { type, content: [{ type: "paragraph" }] }
              : { type: "paragraph" };
            editor
              .chain()
              .insertContentAt(after, block)
              .focus(after + (LIST_ITEMS.has(type) ? 2 : 1))
              .run();
          }}
          onSelect={() =>
            editor.chain().focus().setNodeSelection(blockRange(hovered.pos).before).run()
          }
        />
      )}
      <BubbleMenu editor={editor} options={{ placement: "top-start", offset: 8 }}>
        <FormatToolbar editor={editor} />
      </BubbleMenu>
    </div>
  );
}
