import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, FileIcon, Folder } from "lucide-react";
import { Kbd } from "@/components/atoms/kbd";
import { MenuLabel } from "@/components/primitives/menu";
import type {
  CommandPickerView,
  CommandSource,
  FileEntry,
  FilePickerView,
  FileStatus,
  SlashCommand,
} from "@/lib/composer-pickers";
import { cn } from "@/lib/utils";

type Hint = { keys: string[]; label: string };

const CONFIG_FILE = /\.(json|ya?ml|toml|lock)$/;

const STATUS_TONE: Record<FileStatus, string> = {
  M: "text-orange",
  A: "text-accent-ink",
  D: "text-red",
};

const SOURCE: Record<CommandSource, { label: string; path?: string; tag: string; tone: string }> = {
  project: {
    label: "This project",
    path: ".claude/commands",
    tag: "project",
    tone: "text-accent-ink",
  },
  personal: { label: "Yours", path: "~/.claude/commands", tag: "personal", tone: "text-blue" },
  builtin: { label: "Claude Code", tag: "built-in", tone: "text-ink-4" },
  skill: { label: "Skills", tag: "skill", tone: "text-orange" },
};

function Highlight({ text, query }: { text: string; query: string }) {
  const start = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (start < 0) return text;
  return (
    <>
      {text.slice(0, start)}
      <span className="text-accent-ink">{text.slice(start, start + query.length)}</span>
      {text.slice(start + query.length)}
    </>
  );
}

export function PickerPanel({
  width,
  children,
  hints,
  className,
}: {
  width: number;
  children: ReactNode;
  hints: Hint[];
  className?: string;
}) {
  return (
    <div
      role="listbox"
      className={cn("enter-pop rounded-menu bg-elevated p-1.5 shadow-overlay", className)}
      style={{ width, transformOrigin: "bottom left" }}
    >
      <div className="flex flex-col gap-0.5">{children}</div>
      <div className="mt-1 flex gap-3 border-t border-line px-2.5 pt-2 pb-[3px] text-2xs text-ink-4">
        {hints.map((hint) => (
          <span key={hint.label} className="flex items-center gap-[5px]">
            {hint.keys.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
            {hint.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PickerRow({
  selected,
  onSelect,
  onHover,
  tall = false,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
  tall?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="option"
      aria-selected={selected}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        "interactive press-wide flex cursor-pointer items-center rounded-[7px] px-2.5 select-none",
        tall ? "min-h-10 gap-2.5" : "h-[30px] gap-[9px]",
        selected && "bg-hover",
      )}
    >
      {children}
    </div>
  );
}

function fileIcon(entry: FileEntry) {
  if (entry.folder) return { Icon: Folder, tone: "text-ink-3" };
  return { Icon: FileIcon, tone: CONFIG_FILE.test(entry.name) ? "text-orange" : "text-blue" };
}

function FileRow({
  entry,
  query,
  showDir,
  selected,
  onSelect,
  onHover,
}: {
  entry: FileEntry;
  query: string;
  showDir: boolean;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const { Icon, tone } = fileIcon(entry);
  return (
    <PickerRow selected={selected} onSelect={onSelect} onHover={onHover}>
      <span className={cn("flex", tone)}>
        <Icon width={12} height={12} strokeWidth={2} />
      </span>
      <span className="truncate text-sm">
        <span className="text-ink">
          <Highlight text={entry.name} query={query} />
        </span>
        {showDir && <span className="ml-2 text-ink-4">{entry.dir}</span>}
      </span>
      <span className="ml-auto flex">
        {entry.status && (
          <span className={cn("font-mono text-3xs", STATUS_TONE[entry.status])}>
            {entry.status}
          </span>
        )}
        {entry.folder && <ChevronRight width={11} height={11} className="text-ink-4" />}
      </span>
    </PickerRow>
  );
}

function FolderHeader({ folder }: { folder: string }) {
  const trimmed = folder.slice(0, -1);
  const slash = trimmed.lastIndexOf("/");
  return (
    <div className="flex h-[30px] items-center gap-1.5 px-2.5 text-2xs text-ink-4">
      <ChevronLeft width={11} height={11} strokeWidth={2} />
      <span>{trimmed.slice(0, slash + 1)}</span>
      <span className="text-ink">{trimmed.slice(slash + 1)}/</span>
      <span className="ml-auto flex items-center gap-1">
        <Kbd>⌘↵</Kbd> insert folder
      </span>
    </div>
  );
}

const FILE_HINTS: Record<FilePickerView["mode"], Hint[]> = {
  suggested: [
    { keys: ["↑", "↓"], label: "move" },
    { keys: ["↵"], label: "insert" },
    { keys: ["⇥"], label: "open folder" },
  ],
  search: [
    { keys: ["↑", "↓"], label: "move" },
    { keys: ["↵"], label: "insert" },
    { keys: ["esc"], label: "close" },
  ],
  folder: [
    { keys: ["⌫"], label: "up a level" },
    { keys: ["↵"], label: "insert" },
    { keys: ["⇥"], label: "open folder" },
  ],
};

export function FilePicker({
  view,
  query,
  selected,
  onSelect,
  onHover,
}: {
  view: FilePickerView;
  query: string;
  selected: number;
  onSelect: (entry: FileEntry) => void;
  onHover: (index: number) => void;
}) {
  const rows = (entries: FileEntry[], offset = 0, showDir = true) =>
    entries.map((entry, row) => {
      const position = offset + row;
      return (
        <FileRow
          key={entry.path}
          entry={entry}
          query={view.mode === "search" ? query : ""}
          showDir={showDir}
          selected={position === selected}
          onSelect={() => onSelect(entry)}
          onHover={() => onHover(position)}
        />
      );
    });

  return (
    <PickerPanel width={380} hints={FILE_HINTS[view.mode]}>
      {view.mode === "suggested" && (
        <>
          {view.changed.length > 0 && (
            <MenuLabel className="h-[26px]" trailing={view.changed.length}>
              Changed in this task
            </MenuLabel>
          )}
          {rows(view.changed)}
          {view.recent.length > 0 && <MenuLabel className="h-[26px]">Recent</MenuLabel>}
          {rows(view.recent, view.changed.length)}
        </>
      )}
      {view.mode === "search" && (
        <>
          <MenuLabel className="h-[26px]" trailing={`${view.matches.length} matches`}>
            Files
          </MenuLabel>
          {rows(view.matches)}
          {view.matches.length === 0 && (
            <div className="flex h-[30px] items-center px-2.5 text-xs text-ink-4">
              No files match
            </div>
          )}
        </>
      )}
      {view.mode === "folder" && (
        <>
          <FolderHeader folder={view.folder} />
          {rows(view.entries, 0, false)}
        </>
      )}
    </PickerPanel>
  );
}

function CommandRow({
  command,
  query,
  selected,
  onSelect,
  onHover,
}: {
  command: SlashCommand;
  query: string;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const source = SOURCE[command.source];
  return (
    <PickerRow selected={selected} onSelect={onSelect} onHover={onHover} tall>
      <span className="flex min-w-0 flex-col gap-px">
        <span className="text-sm text-ink">
          /<Highlight text={command.name} query={query} />
          {command.args && <span className="text-ink-4"> {command.args}</span>}
        </span>
        <span className="truncate text-2xs text-ink-4">{command.description}</span>
      </span>
      <span className={cn("ml-auto shrink-0 text-3xs whitespace-nowrap", source.tone)}>
        {source.tag}
      </span>
    </PickerRow>
  );
}

const COMMAND_HINTS: Hint[] = [
  { keys: ["↑", "↓"], label: "move" },
  { keys: ["↵"], label: "run" },
  { keys: ["⇥"], label: "fill in" },
];

export function CommandPicker({
  view,
  query,
  selected,
  onSelect,
  onHover,
}: {
  view: CommandPickerView;
  query: string;
  selected: number;
  onSelect: (command: SlashCommand) => void;
  onHover: (index: number) => void;
}) {
  const rows = (commands: SlashCommand[], offset = 0) =>
    commands.map((command, row) => {
      const position = offset + row;
      return (
        <CommandRow
          key={command.name}
          command={command}
          query={query}
          selected={position === selected}
          onSelect={() => onSelect(command)}
          onHover={() => onHover(position)}
        />
      );
    });

  return (
    <PickerPanel width={400} hints={COMMAND_HINTS}>
      {view.mode === "suggested" ? (
        view.groups.map((group, groupIndex) => (
          <div key={group.source} className="flex flex-col gap-0.5">
            <MenuLabel className="h-[26px]" trailing={SOURCE[group.source].path}>
              {SOURCE[group.source].label}
            </MenuLabel>
            {rows(
              group.commands,
              view.groups
                .slice(0, groupIndex)
                .reduce((total, previous) => total + previous.commands.length, 0),
            )}
          </div>
        ))
      ) : (
        <>
          <MenuLabel className="h-[26px]" trailing={`${view.matches.length} matches`}>
            Commands
          </MenuLabel>
          {rows(view.matches)}
          {view.matches.length === 0 && (
            <div className="flex h-10 items-center px-2.5 text-xs text-ink-4">
              No commands match
            </div>
          )}
        </>
      )}
    </PickerPanel>
  );
}
