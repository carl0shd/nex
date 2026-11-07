import { useState } from "react";
import { GithubMark } from "@/components/atoms/brand-icons";
import { Button } from "@/components/atoms/button";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Menu, MenuItem, MenuLabel } from "@/components/primitives/menu";

export function ImportRepoButton({
  workspaces,
  onImport,
}: {
  workspaces: readonly { id: string; name: string }[];
  onImport: (workspaceId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const only = workspaces.length === 1 ? workspaces[0] : null;
  if (workspaces.length === 0) return null;

  return (
    <AnchoredPopover
      open={open}
      onOpenChange={setOpen}
      align="end"
      side="bottom"
      strategy="fixed"
      trigger={
        <Button
          variant="quiet"
          size="sm"
          aria-expanded={only ? undefined : open}
          onClick={() => (only ? onImport(only.id) : setOpen((value) => !value))}
        >
          <GithubMark width={12} height={12} strokeWidth={2.25} />
          Import from GitHub
        </Button>
      }
    >
      <Menu width={220}>
        <MenuLabel>Import into</MenuLabel>
        {workspaces.map((workspace) => (
          <MenuItem
            key={workspace.id}
            onSelect={() => {
              setOpen(false);
              onImport(workspace.id);
            }}
          >
            <span title={workspace.name}>{workspace.name}</span>
          </MenuItem>
        ))}
      </Menu>
    </AnchoredPopover>
  );
}
