import { useState } from "react";
import { ChevronDown, EyeOff } from "lucide-react";
import { Monogram } from "@/components/atoms/entity-chip";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Menu, MenuItem, MenuLabel } from "@/components/primitives/menu";
import type { HiddenWorkspace } from "@/components/sidebar/types";
import { cn } from "@/lib/utils";

export function HiddenWorkspacesRow({
  workspaces,
  onShow,
}: {
  workspaces: readonly HiddenWorkspace[];
  onShow: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (workspaces.length === 0) return null;
  return (
    <AnchoredPopover
      open={open}
      onOpenChange={setOpen}
      side="top"
      strategy="fixed"
      className="mt-1"
      trigger={
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "interactive press-wide flex h-7 w-full cursor-pointer items-center gap-2 rounded-control px-2 text-xs text-ink-4 select-none hover:bg-hover hover:text-ink-3",
            open && "bg-hover text-ink-3",
          )}
        >
          <EyeOff width={12} height={12} strokeWidth={2.25} />
          {workspaces.length} hidden {workspaces.length === 1 ? "workspace" : "workspaces"}
          <ChevronDown
            width={11}
            height={11}
            strokeWidth={2.25}
            className={cn(
              "transition-[rotate] duration-200 ease-out-strong",
              !open && "-rotate-90",
            )}
          />
        </button>
      }
    >
      <Menu width={230} origin="bottom left" header={<MenuLabel>Show again</MenuLabel>}>
        {workspaces.map((workspace) => (
          <MenuItem
            key={workspace.id}
            onSelect={() => {
              setOpen(false);
              onShow(workspace.id);
            }}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Monogram color={workspace.color} image={workspace.image} icon={workspace.icon}>
                {workspace.name[0]}
              </Monogram>
              <span title={workspace.name} className="truncate">
                {workspace.name}
              </span>
            </span>
          </MenuItem>
        ))}
      </Menu>
    </AnchoredPopover>
  );
}
