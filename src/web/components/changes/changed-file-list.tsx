import { FilePath, StatusLetter, type ChangedFile } from "@/components/changes/diff-file";
import GlideMenu from "@/components/primitives/glide-menu";
import { DiffStat } from "@/components/task/task-tab-bar";
import { cn } from "@/lib/utils";

export function ChangedFileList({
  files,
  selected,
  onSelect,
  className,
}: {
  files: readonly ChangedFile[];
  selected: string;
  onSelect: (path: string) => void;
  className?: string;
}) {
  return (
    <GlideMenu role="listbox" className={cn("flex flex-col gap-px", className)}>
      {files.map((file) => (
        <button
          key={file.path}
          type="button"
          role="option"
          aria-selected={file.path === selected}
          data-menu-row
          onClick={() => onSelect(file.path)}
          className={cn(
            "interactive press-wide relative flex h-[31px] w-full cursor-pointer items-center gap-2.5 rounded-control px-2.5 text-left select-none",
            file.path === selected && "bg-hover",
          )}
        >
          <StatusLetter status={file.status} />
          <FilePath path={file.path} dimFolder={false} />
          <DiffStat added={file.added} removed={file.removed} className="ml-auto" />
        </button>
      ))}
    </GlideMenu>
  );
}
