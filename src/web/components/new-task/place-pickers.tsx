import { useState } from "react";
import { Search } from "iconoir-react";
import { Monogram } from "@/components/atoms/entity-chip";
import { Menu, MenuItem, MenuLabel } from "@/components/primitives/menu";

export interface NewTaskProject {
  id: string;
  name: string;
  workspace: { name: string; color: string };
  branches: string[];
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
  const workspaces = [...new Set(projects.map((project) => project.workspace.name))];
  return (
    <Menu width={240}>
      {workspaces.map((workspace) => (
        <div key={workspace} className="flex flex-col gap-0.5">
          <MenuLabel>{workspace}</MenuLabel>
          {projects
            .filter((project) => project.workspace.name === workspace)
            .map((project) => (
              <MenuItem
                key={project.id}
                checked={project.id === value}
                onSelect={() => onChange(project.id)}
              >
                <span className="flex items-center gap-2">
                  <Monogram size="sm" color={project.workspace.color}>
                    {project.workspace.name[0]}
                  </Monogram>
                  {project.name}
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
    <Menu width={260}>
      <label className="mb-0.5 flex h-8 items-center gap-2 border-b border-line px-2.5 text-xs text-ink-4">
        <Search width={12} height={12} strokeWidth={2} />
        <input
          aria-label="Search branches"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Base branch"
          className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-4"
        />
      </label>
      {shown.map((branch) => (
        <MenuItem key={branch} checked={branch === value} onSelect={() => onChange(branch)}>
          <span className="font-mono text-xs">{branch}</span>
        </MenuItem>
      ))}
    </Menu>
  );
}
