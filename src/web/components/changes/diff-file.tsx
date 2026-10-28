import type { FileDiffMetadata } from "@pierre/diffs";
import { NavArrowDown } from "iconoir-react";
import { DiffStat } from "@/components/task/task-tab-bar";
import { cn } from "@/lib/utils";

export type ChangeStatus = "M" | "A" | "D";

export interface ChangedFile {
  path: string;
  status: ChangeStatus;
  added: number;
  removed: number;
  diff: FileDiffMetadata;
}

export type DiffLayout = "unified" | "split";

const STATUS = {
  M: { tone: "text-orange", word: "modified", badge: "bg-blue-tint text-blue" },
  A: { tone: "text-green", word: "added", badge: "bg-green-tint text-green" },
  D: { tone: "text-red", word: "deleted", badge: "bg-red-tint text-red" },
} as const;

export function StatusLetter({ status }: { status: ChangeStatus }) {
  return (
    <span className={cn("w-2.5 shrink-0 font-mono text-3xs font-semibold", STATUS[status].tone)}>
      {status}
    </span>
  );
}

export function StatusBadge({ status }: { status: ChangeStatus }) {
  return (
    <span className={cn("rounded-[4px] px-1.5 py-px font-mono text-3xs", STATUS[status].badge)}>
      {STATUS[status].word}
    </span>
  );
}

export function FilePath({
  path,
  dimFolder = true,
  className,
}: {
  path: string;
  dimFolder?: boolean;
  className?: string;
}) {
  const slash = path.lastIndexOf("/");
  return (
    <span className={cn("truncate font-mono text-xs", className)}>
      <span className={dimFolder ? "text-ink-4" : "text-ink"}>{path.slice(0, slash + 1)}</span>
      <span className="text-ink">{path.slice(slash + 1)}</span>
    </span>
  );
}

export function DiffFileHeader({
  file,
  expanded,
  onToggle,
  variant = "card",
}: {
  file: ChangedFile;
  expanded: boolean;
  onToggle?: () => void;
  variant?: "card" | "panel";
}) {
  const panel = variant === "panel";
  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
      className={cn(
        "interactive flex w-full cursor-pointer items-center gap-2 bg-surface px-2.5 text-left select-none hover:bg-surface-raised",
        panel ? "h-11 px-3.5" : "h-9",
        expanded && "border-b border-line",
      )}
    >
      <NavArrowDown
        width={11}
        height={11}
        strokeWidth={2.25}
        className={cn(
          "shrink-0 text-ink-4 transition-[rotate] duration-200 ease-out-strong",
          !expanded && "-rotate-90",
        )}
      />
      {panel ? <StatusBadge status={file.status} /> : <StatusLetter status={file.status} />}
      <FilePath path={file.path} dimFolder={!panel} className={panel ? "text-sm" : undefined} />
      <DiffStat
        added={file.added}
        removed={file.removed}
        zeros={false}
        className="ml-auto text-2xs"
      />
    </button>
  );
}
