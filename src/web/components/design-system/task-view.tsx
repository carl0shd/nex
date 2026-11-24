import { useState } from "react";
import { BrowserPanel } from "@/components/browser/browser-panel";
import type { ViewportDevice } from "@/components/browser/browser-viewport";
import { ChangesDock, ChangesPanel } from "@/components/changes/changes-view";
import { Composer } from "@/components/composer/composer";
import { CHANGED_FILES } from "@/components/design-system/changes-samples";
import { TASK_NOTES } from "@/components/design-system/notes-samples";
import { SampleSite } from "@/components/design-system/sample-site";
import { ShellDemo } from "@/components/design-system/shell";
import { Section, Specimen } from "@/components/design-system/specimen";
import { NotesView } from "@/components/notes/notes-view";
import {
  ConnectorsPopover,
  ContextPopover,
  EnvironmentPopover,
  SessionInfoPopover,
  TaskSessionStrip,
  type SessionConnector,
} from "@/components/session/session-details";
import { AgentText, ToolRow, UserBubble, WorkingLine } from "@/components/task/conversation";
import { ExpandedTaskView, TaskChat } from "@/components/task-view/expanded-task-view";
import { TaskDock, type DockTab } from "@/components/task-view/task-dock";
import { TaskViewHeader } from "@/components/task-view/task-view-header";

const ENVIRONMENT = {
  host: "fix-login.nex",
  memory: "1.9 GB",
  services: [
    {
      name: "web",
      detail: "fix-login.nex",
      url: "http://fix-login.nex",
    },
    {
      name: "api",
      detail: "api.fix-login.nex",
      url: "http://api.fix-login.nex",
    },
    { name: "postgres", detail: "own copy" },
    { name: "redis", detail: ":6379" },
  ],
};

const SESSION = {
  account: "Work",
  email: "you@monoku.com",
  plan: "Max",
  mode: "Ask first",
  model: "Opus 5.5 · High",
  cost: "$1.20",
  startedAgo: "12 min ago",
  sessionId: "d30bd0ea",
};

const CONTEXT = {
  used: 68_000,
  total: 200_000,
  compactAt: 90,
  parts: [
    { label: "Conversation", tokens: 41_000 },
    { label: "Files read", tokens: 15_000 },
    { label: "System and tools", tokens: 12_000 },
  ],
};

const CONNECTORS: SessionConnector[] = [
  { name: "Nex browser", letter: "N", state: "in-use" },
  { name: "Linear", letter: "L", state: "connected" },
  { name: "Figma", letter: "F", state: "connected" },
  { name: "Sentry", letter: "S", state: "sign-in" },
  { name: "Postgres", letter: "P", state: "reconnect" },
];

const BROWSER_MENU = {
  externalBrowser: "Arc",
  viewport: "Desktop",
  claudeCanUse: true,
  openTaskLinks: true,
  keepCookies: "Until the task closes",
};

const DIFF = { added: 128, removed: 14 };
const NOTES_SAVED_AT = Date.now() - 2 * 60_000;

function DockContent({ tab, expanded }: { tab: DockTab; expanded: boolean }) {
  const [device, setDevice] = useState<ViewportDevice>("desktop");
  const [picking, setPicking] = useState(false);
  if (tab === "changes") {
    return expanded ? (
      <ChangesPanel files={CHANGED_FILES} base="main" />
    ) : (
      <ChangesDock files={CHANGED_FILES} />
    );
  }
  if (tab === "browser") {
    return (
      <BrowserPanel
        tabs={[{ id: "login", title: "Sign in · hub" }]}
        activeTab="login"
        url="http://fix-login.nex/login?next=/billing"
        device={device}
        onDeviceChange={setDevice}
        picking={picking}
        onPickingChange={setPicking}
        menu={BROWSER_MENU}
      >
        <SampleSite />
      </BrowserPanel>
    );
  }
  if (tab === "shell") return <ShellDemo />;
  return <NotesView defaultValue={TASK_NOTES} savedAt={NOTES_SAVED_AT} />;
}

function TaskViewDemo() {
  const [dockOpen, setDockOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<DockTab>("changes");

  return (
    <ExpandedTaskView
      className="h-[780px] w-full"
      dockOpen={dockOpen}
      dockExpanded={expanded}
      header={
        <TaskViewHeader
          title="Fix login redirect param"
          status="working"
          project="nex"
          branch="feat/fix-login-redirect"
          base="main"
          dockOpen={dockOpen}
          onToggleDock={() => setDockOpen((open) => !open)}
        />
      }
      strip={
        <TaskSessionStrip
          environment={ENVIRONMENT}
          session={SESSION}
          context={CONTEXT}
          connectors={CONNECTORS}
          connectedCount={12}
          summary="$1.20 · 12 min"
        />
      }
      chat={
        <TaskChat
          composer={
            <Composer
              placeholder="Message Claude"
              defaultMode="manual"
              context={34}
              state="working"
            />
          }
        >
          <UserBubble>
            The redirect after login drops the ?next= param. Fix it and add a test.
          </UserBubble>
          <AgentText>
            The callback builds its redirect from the raw query string, so next is lost after the
            OAuth round-trip.
          </AgentText>
          <div className="flex flex-col gap-0.5">
            <ToolRow kind="read" verb="Read" target="src/auth/session.ts" />
            <ToolRow kind="edit" verb="Edit" target="src/auth/session.ts" added={24} removed={6} />
            <ToolRow kind="edit" verb="Write" target="src/auth/session.test.ts" added={61} />
            <ToolRow kind="bash" verb="Bash" target="yarn test src/auth" meta="4 passed" />
          </div>
          <AgentText>
            Tests pass. The logout route builds its redirect the same way, so I’m checking it next.
          </AgentText>
          <WorkingLine>Reading src/routes/logout.tsx…</WorkingLine>
        </TaskChat>
      }
      dock={
        <TaskDock
          tab={tab}
          onTabChange={setTab}
          diff={DIFF}
          expanded={expanded}
          onExpandedChange={setExpanded}
          onClose={() => {
            setDockOpen(false);
            setExpanded(false);
          }}
        >
          <DockContent tab={tab} expanded={expanded} />
        </TaskDock>
      }
    />
  );
}

export function TaskView() {
  return (
    <Section
      id="task-view"
      title="Task view"
      description="The expanded task: header, session strip with a detail per chip, the conversation and the side panel. Expand the panel for full-width Changes."
    >
      <Specimen name="ExpandedTaskView" bare>
        <TaskViewDemo />
      </Specimen>
      <Specimen name="Session strip details · environment · session · context · connectors" bare>
        <div className="flex flex-wrap items-start gap-6">
          <EnvironmentPopover environment={ENVIRONMENT} />
          <SessionInfoPopover session={SESSION} />
          <ContextPopover context={CONTEXT} />
          <ConnectorsPopover connectors={CONNECTORS} connectedCount={12} />
        </div>
      </Specimen>
    </Section>
  );
}
