import { useEffect } from "react";
import type { PermissionRequest } from "@native/agents/permissions";
import { clearAgentExit } from "@/hooks/use-agent-live";
import {
  changesSummary,
  doneMeta,
  needsYouCopy,
  replySummary,
  shipped,
  toolResultText,
  type ToastTask,
} from "@/lib/agent-toasts";
import { dismissToast, notify, notifyCompact } from "@/lib/notify";
import { parseWorktreePatch } from "@/lib/worktree-changes";
import { usePreferencesStore } from "@/stores/preferences.store";
import { usePermissionStore } from "@/stores/permission.store";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { shownSessions } from "@/lib/sidebar-model";

const needsYouId = (requestId: string) => `needs-you:${requestId}`;
const doneId = (sessionId: string) => `done:${sessionId}`;
const stoppedId = (sessionId: string) => `stopped:${sessionId}`;

function taskOf(sessionId: string): (ToastTask & { baseBranch: string }) | null {
  const { sessions, projects, workspaces } = useWorkspaceStore.getState();
  const session = shownSessions({ workspaces, projects, sessions }).find(
    (item) => item.id === sessionId,
  );
  if (!session) return null;
  return {
    title: session.title || session.name,
    project: projects.find((item) => item.id === session.projectId)?.name ?? "",
    branch: session.branch,
    worktreePath: session.worktreePath,
    baseBranch: session.baseBranch,
  };
}

type AlertKind = "notifyNeedsYou" | "notifyFinished" | "notifyErrors";

function viewing(sessionId: string): boolean {
  if (!usePreferencesStore.getState().prefs.onlyInBackground) return false;
  return document.hasFocus() && useWorkspaceStore.getState().activeTaskId === sessionId;
}

const wants = (kind: AlertKind) => usePreferencesStore.getState().prefs[kind];

function announce(sessionId: string, title: string, body: string) {
  const { sound } = usePreferencesStore.getState().prefs;
  if (sound !== "None") void window.api.playSound(sound);
  if (document.hasFocus()) return;
  const notification = new Notification(title, { body, silent: true });
  notification.onclick = () => {
    window.focus();
    openTask(sessionId);
  };
}

const LINK_TOAST_MS = 6000;

const openTask = (sessionId: string) => useWorkspaceStore.getState().openTask(sessionId);

function showNeedsYou(request: PermissionRequest) {
  const task = taskOf(request.sessionId);
  if (!task || !wants("notifyNeedsYou")) return;
  const copy = needsYouCopy(request, task);
  announce(request.sessionId, `${copy.title} needs you`, copy.code ?? copy.body);
  const answer = usePermissionStore.getState().answer;
  notify(
    {
      tone: "orange",
      status: "Needs you",
      meta: copy.meta,
      title: copy.title,
      body: copy.body,
      code: copy.code,
      actions: [
        ...(copy.answerable
          ? [
              {
                label: "Allow once",
                kind: "green" as const,
                onClick: () => void answer(request.id, { behavior: "allow" }),
              },
              {
                label: "Deny",
                kind: "danger" as const,
                onClick: () => void answer(request.id, { behavior: "deny" }),
              },
            ]
          : []),
        { label: "Open", kind: "ghost", onClick: () => openTask(request.sessionId) },
      ],
    },
    { id: needsYouId(request.id) },
  );
}

async function showDone(sessionId: string, event: Record<string, unknown>) {
  const task = taskOf(sessionId);
  if (!task || !wants("notifyFinished")) return;
  const patch = await window.api
    .getWorktreeDiff(task.worktreePath, { baseBranch: task.baseBranch || undefined })
    .catch(() => "");
  if (viewing(sessionId)) return;
  const changes = changesSummary(parseWorktreePatch(patch));
  announce(sessionId, `${task.title} is done`, changes || replySummary(event.result));
  notify(
    {
      tone: "green",
      status: "Done",
      meta: doneMeta(task, typeof event.duration_ms === "number" ? event.duration_ms : undefined),
      title: task.title,
      body: changes || replySummary(event.result) || undefined,
      actions: [
        ...(changes
          ? [
              {
                label: "Review changes",
                kind: "neutral" as const,
                onClick: () => useWorkspaceStore.getState().openTaskView(sessionId, "changes"),
              },
            ]
          : []),
        { label: "Open", kind: changes ? "ghost" : "neutral", onClick: () => openTask(sessionId) },
      ],
    },
    { id: doneId(sessionId) },
  );
}

function showStopped(sessionId: string, body: string) {
  const task = taskOf(sessionId);
  if (!task || !wants("notifyErrors")) return;
  dismissToast(doneId(sessionId));
  announce(sessionId, `${task.title} stopped`, body);
  notify(
    {
      tone: "red",
      status: "Stopped",
      meta: `${task.project} · ${task.branch}`,
      title: task.title,
      body,
      actions: [
        {
          label: "Restart",
          kind: "neutral",
          onClick: () => {
            clearAgentExit(sessionId);
            void window.api.agentWarm(sessionId);
          },
        },
        {
          label: "View output",
          kind: "ghost",
          onClick: () => useWorkspaceStore.getState().openTaskView(sessionId, "agent"),
        },
      ],
    },
    { id: stoppedId(sessionId) },
  );
}

interface ContentPart {
  type?: string;
  id?: string;
  name?: string;
  input?: { command?: unknown };
  tool_use_id?: string;
  content?: unknown;
  is_error?: boolean;
}

function contentParts(event: Record<string, unknown>): ContentPart[] {
  const content = (event.message as { content?: unknown } | undefined)?.content;
  return Array.isArray(content) ? (content as ContentPart[]) : [];
}

function showShipped(sessionId: string, command: string, output: string) {
  const result = shipped(command, output);
  const task = taskOf(sessionId);
  if (!result || !task || !wants("notifyFinished")) return;
  const openUrl = (url: string) => () => void window.api.openExternalUrl(url);
  if (result.kind === "pr") {
    notifyCompact(
      {
        tone: "green",
        title: `${task.title} opened a pull request`,
        action: "Open PR",
        onAction: openUrl(result.url),
      },
      { duration: LINK_TOAST_MS },
    );
    return;
  }
  notifyCompact(
    {
      tone: "green",
      title: `${task.title} pushed to origin`,
      action: result.prUrl ? "Open PR" : undefined,
      onAction: result.prUrl ? openUrl(result.prUrl) : undefined,
    },
    { duration: result.prUrl ? LINK_TOAST_MS : undefined },
  );
}

export function AppAgentToasts() {
  useEffect(() => {
    const toasted = new Set<string>();
    const syncRequests = (requests: readonly PermissionRequest[]) => {
      for (const request of requests) {
        if (toasted.has(request.id)) continue;
        toasted.add(request.id);
        if (!viewing(request.sessionId)) showNeedsYou(request);
      }
      for (const id of toasted) {
        if (requests.some((request) => request.id === id)) continue;
        toasted.delete(id);
        dismissToast(needsYouId(id));
      }
    };
    syncRequests(usePermissionStore.getState().requests);
    const offRequests = usePermissionStore.subscribe((state, previous) => {
      if (state.requests !== previous.requests) syncRequests(state.requests);
    });

    const commands = new Map<string, string>();
    const offEvents = window.api.onAgentEvent(({ sessionId, event }) => {
      if (event.parent_tool_use_id) return;
      for (const part of contentParts(event)) {
        if (part.type === "tool_use" && part.name === "Bash" && part.id) {
          commands.set(part.id, typeof part.input?.command === "string" ? part.input.command : "");
        }
        if (part.type === "tool_result" && part.tool_use_id && commands.has(part.tool_use_id)) {
          const command = commands.get(part.tool_use_id) ?? "";
          commands.delete(part.tool_use_id);
          if (!part.is_error && !viewing(sessionId)) {
            showShipped(sessionId, command, toolResultText(part.content));
          }
        }
      }
      if (viewing(sessionId)) return;
      if (event.type === "result" && event.is_error) {
        showStopped(sessionId, replySummary(event.result) || "The turn ended with an error.");
      } else if (event.type === "result") {
        void showDone(sessionId, event);
      } else if (event.type === "nex_exit" && event.reason !== "missing-worktree") {
        const code = typeof event.code === "number" ? ` with code ${event.code}` : "";
        showStopped(sessionId, `The agent exited${code}. Your changes are still in the worktree.`);
      }
    });

    const offActive = useWorkspaceStore.subscribe((state, previous) => {
      const id = state.activeTaskId;
      if (!id || id === previous.activeTaskId) return;
      dismissToast(doneId(id));
      dismissToast(stoppedId(id));
    });

    return () => {
      offRequests();
      offEvents();
      offActive();
    };
  }, []);

  return null;
}
