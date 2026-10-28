import { useState, type ComponentType, type ReactNode } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { Code, Link, NavArrowDown } from "iconoir-react";
import { Menu, MenuItem } from "@/components/primitives/menu";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { cn } from "@/lib/utils";

type Icon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

type BlockType = "paragraph" | "heading" | "subheading" | "bullet" | "ordered" | "task" | "code";

const BLOCKS: { type: BlockType; label: string }[] = [
  { type: "paragraph", label: "Text" },
  { type: "heading", label: "Heading" },
  { type: "subheading", label: "Subheading" },
  { type: "bullet", label: "Bulleted list" },
  { type: "ordered", label: "Numbered list" },
  { type: "task", label: "To-do list" },
  { type: "code", label: "Code block" },
];

function currentBlock(editor: Editor): BlockType {
  if (editor.isActive("heading", { level: 2 })) return "heading";
  if (editor.isActive("heading", { level: 3 })) return "subheading";
  if (editor.isActive("taskList")) return "task";
  if (editor.isActive("bulletList")) return "bullet";
  if (editor.isActive("orderedList")) return "ordered";
  if (editor.isActive("codeBlock")) return "code";
  return "paragraph";
}

function setBlock(editor: Editor, type: BlockType) {
  const chain = editor.chain().focus();
  if (type === "paragraph") chain.setParagraph().run();
  if (type === "heading") chain.setHeading({ level: 2 }).run();
  if (type === "subheading") chain.setHeading({ level: 3 }).run();
  if (type === "bullet") chain.toggleBulletList().run();
  if (type === "ordered") chain.toggleOrderedList().run();
  if (type === "task") chain.toggleTaskList().run();
  if (type === "code") chain.toggleCodeBlock().run();
}

function ToolbarButton({
  label,
  pressed = false,
  onClick,
  children,
  className,
}: {
  label: string;
  pressed?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "interactive press flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-[7px] text-ink-2 select-none hover:bg-hover hover:text-ink",
        pressed && "bg-hover-2 text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden className="mx-[3px] h-4 w-px bg-line-strong" />;
}

function MarkButton({
  editor,
  mark,
  label,
  active,
  children,
}: {
  editor: Editor;
  mark: "bold" | "italic" | "strike" | "code";
  label: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <ToolbarButton
      label={label}
      pressed={active}
      onClick={() => editor.chain().focus().toggleMark(mark).run()}
    >
      {children}
    </ToolbarButton>
  );
}

function IconGlyph({ icon: Glyph }: { icon: Icon }) {
  return <Glyph width={14} height={14} strokeWidth={2} />;
}

function LinkForm({ editor, onDone }: { editor: Editor; onDone: () => void }) {
  const [href, setHref] = useState<string>(editor.getAttributes("link").href ?? "");
  const apply = () => {
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href.trim()) chain.setLink({ href: href.trim() }).run();
    else chain.unsetLink().run();
    onDone();
  };
  return (
    <div className="enter-pop flex w-[280px] items-center gap-1.5 rounded-field bg-elevated p-1.5 shadow-overlay">
      <input
        autoFocus
        aria-label="Link"
        value={href}
        onChange={(event) => setHref(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") apply();
        }}
        placeholder="Paste or type a link"
        className="h-7 min-w-0 flex-1 rounded-[7px] bg-surface-raised px-2 text-xs text-ink outline-none placeholder:text-ink-4 focus:shadow-focus"
      />
      {editor.isActive("link") && (
        <ToolbarButton
          label="Remove link"
          onClick={() => {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            onDone();
          }}
          className="px-2 text-2xs"
        >
          Remove
        </ToolbarButton>
      )}
    </div>
  );
}

type OpenMenu = "block" | "link" | null;

export function FormatToolbar({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState<OpenMenu>(null);
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      block: currentBlock(current),
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      strike: current.isActive("strike"),
      code: current.isActive("code"),
      link: current.isActive("link"),
    }),
  });
  const toggle = (menu: OpenMenu) => setOpen((current) => (current === menu ? null : menu));
  const blockLabel = BLOCKS.find((block) => block.type === state.block)?.label ?? "Text";

  return (
    <div
      role="toolbar"
      aria-label="Format text"
      className="enter-pop flex items-center gap-px rounded-field bg-elevated p-1 shadow-overlay"
    >
      <AnchoredPopover
        open={open === "block"}
        onOpenChange={(next) => setOpen(next ? "block" : null)}
        side="bottom"
        trigger={
          <ToolbarButton
            label="Text style"
            pressed={open === "block"}
            onClick={() => toggle("block")}
            className="gap-1 pr-1.5 pl-2 text-xs font-medium"
          >
            {blockLabel}
            <NavArrowDown width={10} height={10} strokeWidth={2.25} className="opacity-70" />
          </ToolbarButton>
        }
      >
        <Menu width={190}>
          {BLOCKS.map((block) => (
            <MenuItem
              key={block.type}
              checked={block.type === state.block}
              onSelect={() => {
                setBlock(editor, block.type);
                setOpen(null);
              }}
            >
              {block.label}
            </MenuItem>
          ))}
        </Menu>
      </AnchoredPopover>
      <ToolbarDivider />
      <MarkButton editor={editor} mark="bold" label="Bold" active={state.bold}>
        <span className="text-sm font-bold">B</span>
      </MarkButton>
      <MarkButton editor={editor} mark="italic" label="Italic" active={state.italic}>
        <span className="font-serif text-sm italic">i</span>
      </MarkButton>
      <MarkButton editor={editor} mark="strike" label="Strikethrough" active={state.strike}>
        <span className="text-sm line-through">S</span>
      </MarkButton>
      <MarkButton editor={editor} mark="code" label="Inline code" active={state.code}>
        <IconGlyph icon={Code} />
      </MarkButton>
      <ToolbarDivider />
      <AnchoredPopover
        open={open === "link"}
        onOpenChange={(next) => setOpen(next ? "link" : null)}
        side="bottom"
        trigger={
          <ToolbarButton
            label="Link"
            pressed={state.link || open === "link"}
            onClick={() => toggle("link")}
          >
            <IconGlyph icon={Link} />
          </ToolbarButton>
        }
      >
        <LinkForm editor={editor} onDone={() => setOpen(null)} />
      </AnchoredPopover>
    </div>
  );
}
