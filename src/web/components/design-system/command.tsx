import { useEffect, useState } from "react";
import { CodeXml, FolderPlus, Moon, Settings, SquarePen, Zap } from "lucide-react";
import {
  CommandPalette,
  type CommandChoice,
  type CommandGroup,
} from "@/components/command/command-palette";
import { WORKSPACES } from "@/components/design-system/sidebar-samples";
import { Section, Specimen } from "@/components/design-system/specimen";
import { HomeEmpty } from "@/components/home/home-empty";
import { TitlebarView } from "@/components/layout/titlebar";
import { Sidebar } from "@/components/sidebar/sidebar";

const GROUPS: CommandGroup[] = [
  {
    id: "tasks",
    label: "Tasks",
    items: [
      {
        kind: "task",
        id: "fix-login-redirect",
        label: "fix-login-redirect",
        keywords: ["Fix login redirect param"],
        project: "nex",
        status: "working",
      },
      {
        kind: "task",
        id: "rename-users",
        label: "rename-users-to-accounts",
        keywords: ["Rename users to accounts"],
        project: "api",
        status: "waiting",
      },
      {
        kind: "task",
        id: "onboarding-copy",
        label: "onboarding-copy",
        keywords: ["Onboarding copy pass"],
        project: "website",
        status: "working",
      },
      {
        kind: "task",
        id: "bump-electron",
        label: "bump-electron",
        keywords: ["Bump Electron to 39.2"],
        project: "nex",
        status: "idle",
      },
    ],
  },
  {
    id: "files",
    label: "Files in fix-login-redirect",
    items: [
      { kind: "file", id: "login", label: "src/routes/login.tsx" },
      { kind: "file", id: "logout", label: "src/routes/logout.tsx" },
      { kind: "file", id: "session", label: "src/auth/session.ts" },
      { kind: "file", id: "session-test", label: "src/auth/session.test.ts" },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    items: [
      { kind: "action", id: "new-task", label: "New task", icon: SquarePen, kbd: "⌘T" },
      {
        kind: "action",
        id: "new-project",
        label: "New project",
        icon: FolderPlus,
        kbd: "⌘P",
        keywords: ["add", "repository"],
      },
      {
        kind: "action",
        id: "ide",
        label: "Open in IDE",
        icon: CodeXml,
        kbd: "⌘O",
        keywords: ["editor", "cursor", "vscode"],
      },
      { kind: "action", id: "usage", label: "Usage details", icon: Zap, kbd: "⌘U" },
      {
        kind: "action",
        id: "theme",
        label: "Toggle light / dark",
        icon: Moon,
        kbd: "⌘⇧L",
        keywords: ["theme", "appearance"],
      },
      { kind: "action", id: "settings", label: "Settings", icon: Settings, kbd: "⌘," },
    ],
  },
];

function CommandDemo() {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<CommandChoice | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative flex h-[720px] w-full flex-col overflow-hidden rounded-card bg-page shadow-card">
      <TitlebarView onSearch={() => setOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar workspaces={WORKSPACES} />
        <div className="flex min-w-0 flex-1 flex-col items-center">
          {chosen ? (
            <div className="flex flex-1 items-center text-sm text-ink-3">
              Opened <span className="mx-1 text-ink">{chosen.item.label}</span>
              {chosen.split && "in a split"}
            </div>
          ) : (
            <HomeEmpty />
          )}
        </div>
      </div>
      {open && (
        <CommandPalette
          groups={GROUPS}
          onClose={() => setOpen(false)}
          onSelect={(choice) => {
            setChosen(choice);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

export function Command() {
  return (
    <Section
      id="command"
      title="Command palette"
      description="⌘K from anywhere: jump to a task, a file of the current task or an action. Type to filter, ↑↓ to move, ↵ to open, ⌘↵ to open in a split."
    >
      <Specimen name="CommandPalette · press ⌘K or the search field, then try “log”" bare>
        <CommandDemo />
      </Specimen>
    </Section>
  );
}
