import { useState } from "react";
import { ChangesView } from "@/components/changes/changes-view";
import { Composer } from "@/components/composer/composer";
import { CHANGED_FILES } from "@/components/design-system/changes-samples";
import { TASK_NOTES } from "@/components/design-system/notes-samples";
import { ShellDemo } from "@/components/design-system/shell";
import { NotesView } from "@/components/notes/notes-view";
import {
  AgentText,
  InlineDiff,
  ToolOutput,
  ToolRow,
  UserBubble,
  WorkingLine,
} from "@/components/task/conversation";
import { PermissionCard } from "@/components/task/permission-card";
import { Conversation, TaskCard } from "@/components/task/task-card";
import { TaskHeader } from "@/components/task/task-header";
import { TaskTabBar, type TaskView } from "@/components/task/task-tab-bar";
import { TabBarTrailing } from "@/components/design-system/tab-bar-trailing";

const MONOKU = "#33843F";
const NOTES_SAVED_AT = Date.now() - 2 * 60_000;

export function WorkingCardSample({ state = "focused" }: { state?: "focused" | "rest" }) {
  const [view, setView] = useState<TaskView>("agent");
  return (
    <TaskCard state={state}>
      <TaskHeader
        title="Fix login redirect param"
        project="nex"
        branch="feat/fix-login-redirect"
        workspace={{ name: "Monoku", color: MONOKU }}
        status="working"
      />
      <TaskTabBar
        view={view}
        onViewChange={setView}
        diff={{ added: 128, removed: 14 }}
        trailing={<TabBarTrailing />}
      />
      {view === "changes" && <ChangesView files={CHANGED_FILES} />}
      {view === "notes" && <NotesView defaultValue={TASK_NOTES} savedAt={NOTES_SAVED_AT} />}
      {view === "shell" && <ShellDemo />}
      {view === "agent" && (
        <>
          <Conversation>
            <UserBubble>
              The redirect after login drops the ?next= param. Fix it and add a test.
            </UserBubble>
            <AgentText>
              The callback builds its redirect from the raw query string, so next is lost after the
              OAuth round-trip.
            </AgentText>
            <div className="flex flex-col gap-0.5">
              <ToolRow kind="read" verb="Read" target="src/auth/session.ts" />
              <ToolRow kind="edit" verb="Edit" target="src/auth/session.ts" added={24} removed={6}>
                <InlineDiff
                  lines={[
                    { sign: "-", code: "  return redirect('/');" },
                    { sign: "+", code: "  const next = safeNext(session.state?.next);" },
                    { sign: "+", code: "  if (!next) return redirect('/');" },
                    {
                      sign: "+",
                      code: "  return redirect(next, { headers: clearState() });",
                    },
                  ]}
                />
              </ToolRow>
              <ToolRow kind="bash" verb="Bash" target="yarn test src/auth" meta="4 passed">
                <ToolOutput>PASS src/auth/session.test.ts (4 tests)</ToolOutput>
              </ToolRow>
            </div>
            <AgentText>
              Tests pass. The logout route builds its redirect the same way, so I’m checking it
              next.
            </AgentText>
            <WorkingLine>Reading src/routes/logout.tsx…</WorkingLine>
          </Conversation>
          <Composer
            placeholder="Reply to Claude…"
            defaultMode="edits"
            context={34}
            state="working"
          />
        </>
      )}
    </TaskCard>
  );
}

export function WaitingCardSample() {
  const [view, setView] = useState<TaskView>("agent");
  return (
    <TaskCard state="waiting">
      <TaskHeader
        title="Rename users to accounts"
        project="api"
        branch="feat/accounts-table"
        workspace={{ name: "Monoku", color: MONOKU }}
        status="waiting"
      />
      <TaskTabBar
        view={view}
        onViewChange={setView}
        agentWaiting
        diff={{ added: 42, removed: 18 }}
        trailing={<TabBarTrailing />}
      />
      <Conversation>
        <UserBubble>
          Rename users to accounts and drop the old table once the migration passes.
        </UserBubble>
        <div className="flex flex-col gap-0.5">
          <ToolRow kind="edit" verb="Write" target="db/migrations/0042_accounts.sql" added={38} />
          <ToolRow kind="bash" verb="Bash" target="yarn db:migrate" meta="ok" />
        </div>
        <AgentText>
          I’ll drop the table, its three indexes and the old sequence, then re-run the migration
          test against a fresh database.
        </AgentText>
        <PermissionCard
          title="Claude wants to run a command"
          subject='psql $DATABASE_URL -c "DROP TABLE users_old"'
        />
      </Conversation>
      <Composer placeholder="Or tell Claude what to do instead…" context={62} state="idle" />
    </TaskCard>
  );
}

export function IdleCardSample({
  title,
  project,
  branch,
  ask,
  answer,
}: {
  title: string;
  project: string;
  branch: string;
  ask: string;
  answer: string;
}) {
  const [view, setView] = useState<TaskView>("agent");
  return (
    <TaskCard state="rest">
      <TaskHeader
        title={title}
        project={project}
        branch={branch}
        workspace={{ name: "Monoku", color: MONOKU }}
        status="idle"
      />
      <TaskTabBar view={view} onViewChange={setView} diff={{ added: 12, removed: 3 }} />
      <Conversation>
        <UserBubble>{ask}</UserBubble>
        <AgentText>{answer}</AgentText>
      </Conversation>
      <Composer placeholder="Reply to Claude…" state="idle" />
    </TaskCard>
  );
}
