import type { ReactNode } from "react";
import { Collapse, Expand, Globe, Xmark } from "iconoir-react";
import { IconButton } from "@/components/atoms/icon-button";
import { Tabs } from "@/components/atoms/tabs";
import { DiffStat } from "@/components/task/task-tab-bar";
import { cn } from "@/lib/utils";

export type DockTab = "changes" | "browser" | "shell" | "notes";

export function TaskDock({
  tab,
  onTabChange,
  diff,
  expanded,
  onExpandedChange,
  onClose,
  children,
  className,
}: {
  tab: DockTab;
  onTabChange: (tab: DockTab) => void;
  diff: { added: number; removed: number };
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex h-12 shrink-0 items-center gap-1.5 px-2.5">
        <Tabs
          value={tab}
          onChange={onTabChange}
          items={[
            {
              value: "changes",
              label: (
                <>
                  Changes <DiffStat {...diff} />
                </>
              ),
            },
            {
              value: "browser",
              label: (
                <>
                  <Globe width={12} height={12} strokeWidth={2} />
                  Browser
                </>
              ),
            },
            { value: "shell", label: "Shell" },
            { value: "notes", label: "Notes" },
          ]}
        />
        <span className="ml-auto flex items-center">
          <IconButton
            size="sm"
            aria-label={expanded ? "Collapse panel" : "Expand panel"}
            onClick={() => onExpandedChange(!expanded)}
          >
            {expanded ? (
              <Collapse width={13} height={13} strokeWidth={2} />
            ) : (
              <Expand width={13} height={13} strokeWidth={2} />
            )}
          </IconButton>
          <IconButton size="sm" aria-label="Close panel" onClick={onClose}>
            <Xmark width={14} height={14} strokeWidth={2} />
          </IconButton>
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </aside>
  );
}
