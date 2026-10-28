import { NavArrowDown } from "iconoir-react";
import { Monogram } from "@/components/atoms/entity-chip";
import { cn } from "@/lib/utils";
import type { SidebarWorkspace } from "@/components/sidebar/types";

export function WorkspaceHeader({
  workspace,
  onToggle,
}: {
  workspace: SidebarWorkspace;
  onToggle?: () => void;
}) {
  const projectCount = workspace.projects.length;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="interactive press-wide flex h-8 w-full cursor-pointer items-center gap-2 pr-1.5 pl-2 select-none"
    >
      <Monogram color={workspace.color}>{workspace.name[0]}</Monogram>
      <span className="text-sm font-semibold text-ink">{workspace.name}</span>
      <NavArrowDown
        width={12}
        height={12}
        strokeWidth={2.25}
        className={cn(
          "text-ink-4 transition-[rotate] duration-200 ease-out-strong",
          !workspace.expanded && "-rotate-90",
        )}
      />
      {!workspace.expanded && (
        <span className="ml-auto text-2xs text-ink-4">
          {projectCount} {projectCount === 1 ? "project" : "projects"}
        </span>
      )}
    </button>
  );
}
