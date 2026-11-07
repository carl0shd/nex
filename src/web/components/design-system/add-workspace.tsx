import { useState } from "react";
import { detect, detectWithEnvironment, FOUND } from "@/components/design-system/project-samples";
import { WORKSPACES } from "@/components/design-system/sidebar-samples";
import { Section, Specimen } from "@/components/design-system/specimen";
import { HomeEmpty } from "@/components/home/home-empty";
import { Overlay } from "@/components/primitives/overlay";
import { AddProjectDialog, type NewProject } from "@/components/projects/add-project-dialog";
import { RemoveProjectDialog } from "@/components/projects/remove-project-dialog";
import { NewWorkspaceRow, type NewWorkspace } from "@/components/sidebar/new-workspace-row";
import { RemoveWorkspaceDialog } from "@/components/sidebar/remove-workspace-dialog";
import { Sidebar } from "@/components/sidebar/sidebar";
import type { SidebarWorkspace } from "@/components/sidebar/types";
import { notifyCompact } from "@/lib/notify";

const STARTING: SidebarWorkspace[] = WORKSPACES.map((workspace) => ({
  ...workspace,
  expanded: false,
}));

function AddWorkspaceDemo() {
  const [workspaces, setWorkspaces] = useState(STARTING);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState<SidebarWorkspace | null>(null);

  const create = (draft: NewWorkspace) => {
    const workspace: SidebarWorkspace = {
      id: draft.name.toLowerCase(),
      name: draft.name,
      color: draft.color,
      projects: [],
      expanded: true,
    };
    setWorkspaces((list) => [...list, workspace]);
    setCreating(false);
    notifyCompact(
      {
        tone: "green",
        title: `${draft.name} created`,
        action: "Add a project",
        onAction: () => setAdding(workspace),
      },
      { duration: 6000 },
    );
  };

  const addProject = ({ repo }: NewProject) => {
    if (!adding) return;
    setWorkspaces((list) =>
      list.map((workspace) =>
        workspace.id === adding.id
          ? { ...workspace, projects: [...workspace.projects, { name: repo.name, tasks: [] }] }
          : workspace,
      ),
    );
    notifyCompact({ tone: "green", title: `${repo.name} added to ${adding.name}` });
    setAdding(null);
  };

  return (
    <div className="relative flex h-[720px] w-full overflow-hidden rounded-card bg-page shadow-card">
      <Sidebar
        workspaces={workspaces}
        creating={
          creating && <NewWorkspaceRow onCreate={create} onCancel={() => setCreating(false)} />
        }
        onAddWorkspace={() => setCreating(true)}
        onAddProject={(id) =>
          setAdding(workspaces.find((workspace) => workspace.id === id) ?? null)
        }
        onToggleWorkspace={(id) =>
          setWorkspaces((list) =>
            list.map((workspace) =>
              workspace.id === id ? { ...workspace, expanded: !workspace.expanded } : workspace,
            ),
          )
        }
      />
      <div className="flex min-w-0 flex-1 flex-col items-center">
        <HomeEmpty />
      </div>
      {adding && (
        <Overlay offset={90} onClose={() => setAdding(null)}>
          <AddProjectDialog
            workspace={adding}
            found={FOUND}
            detect={detect}
            onAdd={addProject}
            onCancel={() => setAdding(null)}
            clone={() => null}
          />
        </Overlay>
      )}
    </div>
  );
}

const STUDIO = { name: "Studio", color: "#2f6fd6" };

export function AddWorkspace() {
  return (
    <Section
      id="add-workspace"
      title="Add workspace and project"
      description="A workspace is named right in the sidebar; its first project comes from a dropped folder or a repo found on this Mac, with a summary you can open line by line."
    >
      <Specimen
        name="Add workspace · press it in the sidebar, type a name, ↵, then Add a project"
        bare
      >
        <AddWorkspaceDemo />
      </Specimen>
      <Specimen name="AddProjectDialog · no project picked yet" bare>
        <AddProjectDialog
          workspace={STUDIO}
          found={FOUND}
          detect={detect}
          onAdd={() => {}}
          onCancel={() => {}}
        />
      </Specimen>
      <div className="flex flex-wrap items-start gap-10">
        <Specimen name="Summary · branches open" bare>
          <AddProjectDialog
            workspace={STUDIO}
            found={FOUND}
            detect={detect}
            initialRepo={FOUND[0]}
            initialSection="branch"
            onAdd={() => {}}
            onCancel={() => {}}
            clone={() => null}
          />
        </Specimen>
        <Specimen name="Worktree setup open" bare>
          <AddProjectDialog
            workspace={STUDIO}
            found={FOUND}
            detect={detect}
            initialRepo={FOUND[0]}
            initialSection="setup"
            onAdd={() => {}}
            onCancel={() => {}}
            clone={() => null}
          />
        </Specimen>
        <Specimen name="Quick commands open" bare>
          <AddProjectDialog
            workspace={STUDIO}
            found={FOUND}
            detect={detect}
            initialRepo={FOUND[0]}
            initialSection="commands"
            onAdd={() => {}}
            onCancel={() => {}}
            clone={() => null}
          />
        </Specimen>
        <Specimen name="RemoveWorkspaceDialog · from the workspace's … menu" bare>
          <RemoveWorkspaceDialog workspace={{ name: "Studio", projects: 3, tasks: 4 }} />
        </Specimen>
        <Specimen name="RemoveProjectDialog · from the project's … menu" bare>
          <RemoveProjectDialog project={{ name: "atlas", workspace: "Studio", tasks: 2 }} />
        </Specimen>
        <Specimen name="With environments · each task runs its own services" bare>
          <AddProjectDialog
            workspace={{ name: "Monoku", color: "#33843F" }}
            found={FOUND}
            detect={detectWithEnvironment}
            initialRepo={{ ...FOUND[0], path: "~/code/atlas" }}
            initialSection="environment"
            onAdd={() => {}}
            onCancel={() => {}}
            clone={() => null}
          />
        </Specimen>
      </div>
    </Section>
  );
}
