import { useState } from "react";
import { Search } from "lucide-react";
import { Monogram } from "@/components/atoms/entity-chip";
import { Menu, MenuItem, MenuLabel } from "@/components/primitives/menu";
import { VirtualMenu } from "@/components/primitives/virtual-menu";
import type { WorkspaceIconName } from "@/lib/workspace-icons";

export interface NewTaskProject {
  id: string;
  name: string;
  workspace: {
    id: string;
    name: string;
    color: string;
    image?: string;
    icon?: WorkspaceIconName;
  };
  branches: string[];
  branchPrefix?: string;
  environment?: boolean;
}

export function ProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: readonly NewTaskProject[];
  value: string;
  onChange: (id: string) => void;
}) {
  const workspaces = [
    ...new Map(projects.map((project) => [project.workspace.id, project.workspace])).values(),
  ];
  return (
    <Menu width={240} maxHeight={320}>
      {workspaces.map((workspace) => (
        <div key={workspace.id} className="flex flex-col gap-0.5">
          <MenuLabel>{workspace.name}</MenuLabel>
          {projects
            .filter((project) => project.workspace.id === workspace.id)
            .map((project) => (
              <MenuItem
                key={project.id}
                checked={project.id === value}
                onSelect={() => onChange(project.id)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Monogram
                    size="sm"
                    color={workspace.color}
                    image={workspace.image}
                    icon={workspace.icon}
                  >
                    {workspace.name[0]}
                  </Monogram>
                  <span title={project.name} className="truncate">
                    {project.name}
                  </span>
                </span>
              </MenuItem>
            ))}
        </div>
      ))}
    </Menu>
  );
}

export function BranchPicker({
  branches,
  value,
  onChange,
}: {
  branches: readonly string[];
  value: string;
  onChange: (branch: string) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = branches.filter((branch) => branch.toLowerCase().includes(query.toLowerCase()));
  return (
    <VirtualMenu
      width={260}
      maxHeight={296}
      items={shown}
      itemKey={(branch) => branch}
      selectedIndex={shown.indexOf(value)}
      header={
        <label className="mb-1 flex h-8 items-center gap-2 border-b border-line px-2.5 text-xs text-ink-4">
          <Search width={12} height={12} strokeWidth={2} />
          <input
            autoFocus
            aria-label="Search branches"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Base branch"
            className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-4"
          />
        </label>
      }
      empty={
        <span className="truncate px-2.5 py-2 text-xs text-ink-4">
          {branches.length === 0 ? "This project isn’t a git repo" : `No branch matches “${query}”`}
        </span>
      }
      renderItem={(branch) => (
        <MenuItem checked={branch === value} onSelect={() => onChange(branch)}>
          <span title={branch} className="truncate">
            {branch}
          </span>
        </MenuItem>
      )}
    />
  );
}
