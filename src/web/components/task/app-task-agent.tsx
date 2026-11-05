import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import type { AgentMessage } from "@native/agents/agent-runner";
import type { AgentSettings } from "@native/agents/agent-settings";
import { modeFromCli } from "@native/agents/cli-modes";
import type { McpServer } from "@native/agents/mcp-servers";
import type { PermissionRequest } from "@native/agents/permissions";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Composer, type ComposerHandle } from "@/components/composer/composer";
import type { Effort } from "@/components/composer/effort";
import type { PermissionMode } from "@/components/composer/permission-menu";
import type { ChangedFile } from "@/components/changes/diff-file";
import { AgentConversation } from "@/components/task/agent-conversation";
import { PlanApproval } from "@/components/task/block-cards";
import { DropOverlay } from "@/components/composer/drop-overlay";
import { ImageViewer } from "@/components/task/image-viewer";
import { MarkdownText } from "@/components/task/markdown-text";
import { PermissionCard } from "@/components/task/permission-card";
import { QuestionCard, type Question } from "@/components/task/question-card";
import { TaskEmptyState } from "@/components/task/task-empty-state";
import { useAgentContext } from "@/hooks/use-agent-context";
import { clearAgentExit, useAgentLive } from "@/hooks/use-agent-live";
import { useFileDrop } from "@/hooks/use-file-drop";
import { useNow } from "@/hooks/use-now";
import { useOnline } from "@/hooks/use-online";
import { useTranscript } from "@/hooks/use-transcript";
import { mergeEntries, turnTokens } from "@/lib/agent-live";
import { connectorGroups } from "@/lib/connectors";
import { agentMessage, messageText } from "@/lib/agent-message";
import type { SlashCommand, WorktreeFile } from "@/lib/composer-pickers";
import { permissionPrompt, planTitle } from "@/lib/tool-display";
import { useAgentModels } from "@/hooks/use-agent-models";
import { slashSettings } from "@/lib/slash-settings";
import { buildConversation } from "@/lib/transcript";
import { useCloseTaskStore } from "@/stores/close-task.store";
import { usePermissionStore } from "@/stores/permission.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

const SENDING_GRACE_MS = 10_000;
const INTERRUPTED_LABEL = "Interrupted by you";
const OWN_ESCAPE = "input:not([type='checkbox']), [role='dialog'], [role='menu']";
const OPEN_OVERLAY = "[role='dialog'], [role='menu'], [aria-modal='true']";
const ENDED_AFTER_MS = 24 * 60 * 60 * 1000;
const resumed = new Set<string>();
const RECOMMENDED = /\s*\(recommended\)\s*$/i;
const MODE_AFTER_PLAN: PermissionMode = "edits";
const KEEP_PLANNING = "Keep planning. I want to refine the plan before you start.";
const baseName = (path: string) => path.slice(path.lastIndexOf("/") + 1);
const knownSettings = new Map<string, AgentSettings>();

interface QueuedMessage {
  id: string;
  text: string;
  content: Promise<AgentMessage>;
}

interface RawQuestion {
  question?: string;
  multiSelect?: boolean;
  options?: { label?: string; description?: string }[];
}

function questionsOf(request: PermissionRequest): Question[] {
  const raw = Array.isArray(request.input.questions)
    ? (request.input.questions as RawQuestion[])
    : [];
  return raw.map((question) => ({
    question: question.question ?? "",
    multiple: Boolean(question.multiSelect),
    options: (question.options ?? []).map((option) => {
      const label = option.label ?? "";
      const recommended = RECOMMENDED.test(label);
      return {
        value: label,
        label: label.replace(RECOMMENDED, ""),
        hint: [recommended && "Recommended", option.description].filter(Boolean).join(" · "),
      };
    }),
  }));
}

function joinMessages(contents: AgentMessage[]): AgentMessage {
  if (contents.every((content) => typeof content === "string")) return contents.join("\n\n");
  return contents.flatMap((content) =>
    typeof content === "string" ? [{ type: "text", text: content }] : content,
  );
}

function lastActivity(entries: readonly unknown[]): number | null {
  for (let index = entries.length - 1; index >= 0; index--) {
    const at = (entries[index] as { timestamp?: string }).timestamp;
    if (at) return Date.parse(at);
  }
  return null;
}

function planBody(plan: string): string {
  return plan.replace(/^#{1,3}\s+.+\n?/m, "").trim();
}

export interface AgentHandle {
  focusReply: (insert?: string) => void;
}

export function AppTaskAgent({
  sessionId,
  terminalId,
  cwd,
  branch,
  base,
  working,
  focused,
  changedFiles,
  onOpenInTerminal,
  onViewChanges,
  ref,
}: {
  ref?: Ref<AgentHandle>;
  focused: boolean;
  changedFiles: readonly ChangedFile[];
  sessionId: string;
  terminalId: string;
  cwd: string;
  branch: string;
  base: string;
  working: boolean;
  onOpenInTerminal?: (command: string) => void;
  onViewChanges?: () => void;
}) {
  const transcript = useTranscript(terminalId);
  const [settings, setSettings] = useState<AgentSettings | null>(
    () => knownSettings.get(sessionId) ?? null,
  );
  const [worktreeFiles, setWorktreeFiles] = useState<string[]>([]);
  const [commands, setCommands] = useState<SlashCommand[]>([]);
  const [servers, setServers] = useState<McpServer[]>([]);
  const loadServers = () => void window.api.mcpStatus(sessionId).then(setServers);
  const [busyServers, setBusyServers] = useState<ReadonlySet<string>>(new Set());
  const updateServer = (name: string, change: () => Promise<McpServer[]>) => {
    setBusyServers((current) => new Set([...current, name]));
    void change()
      .then(setServers)
      .finally(() =>
        setBusyServers((current) => new Set([...current].filter((item) => item !== name))),
      );
  };
  useEffect(() => {
    let cancelled = false;
    void window.api
      .listWorktreeFiles(cwd)
      .then(
        (entries) =>
          !cancelled &&
          setWorktreeFiles(
            entries.filter((entry) => entry.type === "file").map((entry) => entry.path),
          ),
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cwd]);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      void window.api.agentCommands(sessionId).then((next) => !cancelled && setCommands(next));
    const loadMcp = () =>
      void window.api.mcpStatus(sessionId).then((next) => !cancelled && setServers(next));
    load();
    const off = window.api.onAgentCommands((info) => {
      load();
      if (info.sessionId === sessionId) loadMcp();
    });
    return () => {
      cancelled = true;
      off();
    };
  }, [sessionId]);
  useEffect(() => {
    if (focused) void window.api.agentWarm(sessionId);
  }, [focused, sessionId]);
  const files = useMemo<WorktreeFile[]>(() => {
    const status = new Map(changedFiles.map((file) => [file.path, file.status]));
    return worktreeFiles.map((path) => ({ path, status: status.get(path) }));
  }, [worktreeFiles, changedFiles]);
  const [sent, setSent] = useState<
    { id: string; text: string; known: ReadonlySet<string>; at: number }[]
  >([]);
  const [queued, setQueued] = useState<QueuedMessage[]>([]);
  useEffect(() => {
    let cancelled = false;
    void window.api.getAgentSettings(sessionId).then((next) => {
      knownSettings.set(sessionId, next);
      if (!cancelled) setSettings(next);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);
  const live = useAgentLive(sessionId);
  const containerRef = useRef<HTMLDivElement>(null);
  const models = useAgentModels();
  const composerRef = useRef<ComposerHandle>(null);
  useImperativeHandle(ref, () => ({
    focusReply: (insert) => {
      composerRef.current?.focus();
      if (insert) composerRef.current?.insert(insert);
    },
  }));
  const [viewer, setViewer] = useState<{ images: readonly string[]; index: number } | null>(null);
  const { dragging, dropHandlers } = useFileDrop((dropped) => composerRef.current?.attach(dropped));
  const runningSince = useWorkspaceStore((s) => s.runningSince[sessionId]);
  const setAgentRunning = useWorkspaceStore((s) => s.setAgentRunning);
  const showCloseTask = useCloseTaskStore((s) => s.show);
  const now = useNow(working ? 1000 : 5000);
  const thinkingSeconds = runningSince ? Math.max(0, Math.round((now - runningSince) / 1000)) : 0;
  const entries = useMemo(() => mergeEntries(transcript, live.entries), [transcript, live.entries]);
  const items = useMemo(() => buildConversation(entries), [entries]);
  const contextUsage = useAgentContext(
    sessionId,
    focused,
    `${working}-${Boolean(live.compacting)}-${items.length}`,
  );
  const context = contextUsage?.percent ?? null;
  const online = useOnline();
  const [, setOnlineCheck] = useState(0);
  const [resumedHere, setResumedHere] = useState(() => resumed.has(sessionId));
  const lastAt = lastActivity(entries);
  const endedAt = !resumedHere && lastAt !== null && now - lastAt > ENDED_AFTER_MS ? lastAt : null;
  const resume = () => {
    resumed.add(sessionId);
    setResumedHere(true);
  };
  const allRequests = usePermissionStore((s) => s.requests);
  const answering = usePermissionStore((s) => s.answering);
  const answer = usePermissionStore((s) => s.answer);
  const request = allRequests.find((item) => item.sessionId === sessionId);
  const questions = request?.tool === "AskUserQuestion" ? questionsOf(request) : null;
  const plan = request?.tool === "ExitPlanMode" ? String(request.input.plan ?? "") : null;
  const [picked, setPicked] = useState<{ requestId: string; answers: string[][] } | null>(null);
  const answers = picked && picked.requestId === request?.id ? picked.answers : [];
  const userItems = items.filter((item) => item.kind === "user");
  const promptHistory = userItems
    .map((item) => item.text)
    .filter((text, index, all) => text !== all[index - 1]);
  const arrived = (message: (typeof sent)[number]) =>
    userItems.some((item) => item.text === message.text && !message.known.has(item.id));
  const sending = sent.filter(
    (message) => !arrived(message) && (working || now - message.at < SENDING_GRACE_MS),
  );
  const prompt = request && permissionPrompt(request.tool, request.input, cwd);

  const showSending = (text: string) =>
    setSent((previous) => [
      ...previous.filter((message) => !arrived(message)),
      {
        id: crypto.randomUUID(),
        text,
        known: new Set(userItems.map((item) => item.id)),
        at: Date.now(),
      },
    ]);

  const busy = working || Boolean(request);
  const flush = () => {
    if (queued.length === 0) return;
    const batch = queued;
    void Promise.all(batch.map((message) => message.content)).then((contents) => {
      setQueued((current) => current.filter((message) => !batch.includes(message)));
      setAgentRunning(sessionId, true);
      showSending(batch.map((message) => message.text).join("\n\n"));
      void window.api.agentSend(sessionId, joinMessages(contents));
    });
  };
  const flushQueue = useRef(flush);
  useEffect(() => {
    flushQueue.current = flush;
  });
  useEffect(() => {
    if (!busy) flushQueue.current();
  }, [busy, queued.length]);

  const [interruptedAt, setInterruptedAt] = useState<number | null>(null);
  const interruptPending =
    interruptedAt !== null &&
    !items
      .slice(interruptedAt)
      .some((item) => item.kind === "divider" && INTERRUPTED_LABEL === item.label);
  const interrupt = () => {
    if (working) setInterruptedAt(items.length);
    void window.api.agentInterrupt(sessionId);
    setAgentRunning(sessionId, false);
  };
  const busyCompacting = Boolean(live.compacting);
  useHotkey(
    "Escape",
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(OWN_ESCAPE) || document.querySelector(OPEN_OVERLAY)) return;
      interrupt();
    },
    {
      enabled: focused && (working || busyCompacting),
      conflictBehavior: "allow",
      preventDefault: false,
      stopPropagation: false,
    },
  );

  const changeSettings = (next: AgentSettings) => {
    knownSettings.set(sessionId, next);
    setSettings(next);
    void window.api.configureAgent(sessionId, next);
  };
  const answerQuestions = (response?: string) => {
    if (!request || !questions) return;
    const chosen = Object.fromEntries(
      questions.map((question, index) => [question.question, (answers[index] ?? []).join(", ")]),
    );
    void answer(request.id, {
      behavior: "allow",
      updatedInput: {
        ...request.input,
        answers: response ? {} : chosen,
        ...(response && { response }),
      },
    });
  };

  const footer = request ? (
    questions ? (
      <QuestionCard
        questions={questions}
        answers={answers}
        answering={answering.includes(request.id)}
        onChange={(index, values) => {
          const next = [...answers];
          next[index] = values;
          setPicked({ requestId: request.id, answers: next });
        }}
        onAnswer={() => answerQuestions()}
        onOther={() => composerRef.current?.focus()}
      />
    ) : plan !== null ? (
      <PlanApproval
        title={planTitle(plan)}
        answering={answering.includes(request.id)}
        onApprove={() => {
          void answer(request.id, { behavior: "allow" });
          if (settings) changeSettings({ ...settings, mode: MODE_AFTER_PLAN });
        }}
        onKeepPlanning={() => void answer(request.id, { behavior: "deny", message: KEEP_PLANNING })}
      >
        <MarkdownText text={planBody(plan)} />
      </PlanApproval>
    ) : (
      prompt && (
        <PermissionCard
          title={prompt.title}
          subject={prompt.subject}
          alwaysLabel={prompt.alwaysLabel}
          canRemember={request.canRemember}
          answering={answering.includes(request.id)}
          onAllow={() => void answer(request.id, { behavior: "allow" })}
          onAlwaysAllow={() => void answer(request.id, { behavior: "allow", remember: true })}
          onDeny={() => void answer(request.id, { behavior: "deny" })}
        />
      )
    )
  ) : undefined;

  const empty =
    items.length === 0 &&
    !working &&
    !request &&
    sending.length === 0 &&
    queued.length === 0 &&
    !live.exit;

  return (
    <div
      ref={containerRef}
      {...dropHandlers}
      className="relative flex min-h-0 flex-1 flex-col rounded-b-[inherit]"
    >
      {dragging && <DropOverlay images={dragging.images} files={dragging.files} />}
      {viewer && (
        <ImageViewer
          images={viewer.images}
          index={viewer.index}
          onIndexChange={(index) => setViewer({ ...viewer, index })}
          onClose={() => setViewer(null)}
        />
      )}
      {empty ? (
        <TaskEmptyState branch={branch} base={base} />
      ) : (
        <AgentConversation
          items={items}
          cwd={cwd}
          branch={branch}
          base={base}
          working={working}
          thinkingSeconds={thinkingSeconds}
          thinkingTokens={turnTokens(live)}
          liveBlocks={live.blocks}
          subagents={live.subagents}
          retry={live.retry}
          compacting={live.compacting}
          interrupting={interruptPending}
          exit={live.exit}
          offline={!online}
          endedAt={endedAt}
          context={context}
          sending={sending}
          queued={queued}
          onQueuedSend={interrupt}
          onQueuedEdit={(id) => {
            const message = queued.find((item) => item.id === id);
            setQueued((current) => current.filter((item) => item.id !== id));
            if (message) composerRef.current?.replace(message.text);
          }}
          onQueuedCancel={(id) => setQueued((current) => current.filter((item) => item.id !== id))}
          actions={{
            onOpenImages: (images, index) => setViewer({ images, index }),
            onRetryOnline: () => setOnlineCheck((count) => count + 1),
            onResume: () => {
              resume();
              composerRef.current?.focus();
            },
            onStartFresh: () => {
              resume();
              void window.api.agentSend(sessionId, "/clear");
            },
            onOpenInTerminal,
            onOpenUrl: (url) => void window.api.openExternalUrl(url),
            onViewChanges,
            onCompact: () => void window.api.agentSend(sessionId, "/compact"),
            onCloseTask: () => showCloseTask(sessionId),
            onRestart: () => {
              clearAgentExit(sessionId);
              void window.api.agentWarm(sessionId);
            },
          }}
          searchable={focused}
          footer={footer}
        />
      )}
      {settings && (
        <Composer
          ref={composerRef}
          ownDrop={false}
          draftKey={sessionId}
          models={models}
          key={`${settings.model}-${settings.effort}`}
          defaultMode={
            ((live.permissionMode && modeFromCli(live.permissionMode)) ||
              settings.mode) as PermissionMode
          }
          defaultModel={settings.model}
          defaultEffort={settings.effort as Effort}
          contextUsage={contextUsage}
          onCompact={() => void window.api.agentSend(sessionId, "/compact")}
          connectors={connectorGroups(servers, busyServers)}
          onConnectorsOpen={loadServers}
          onConnectorToggle={(name, enabled) =>
            updateServer(name, () => window.api.mcpToggle(sessionId, name, enabled))
          }
          onConnectorRetry={(name) =>
            updateServer(name, () =>
              servers.find((server) => server.name === name)?.status === "needs-auth"
                ? window.api.mcpSignIn(sessionId, name)
                : window.api.mcpReconnect(sessionId, name),
            )
          }
          onConnectorRemove={(name) =>
            updateServer(name, () => window.api.mcpRemove(sessionId, name))
          }
          typeToFocus={focused && !questions}
          history={promptHistory}
          onPickFiles={async () =>
            (await window.api.pickFiles()).map((path) => ({ name: baseName(path), path }))
          }
          onSettingsChange={(next) => {
            knownSettings.set(sessionId, next);
            void window.api.configureAgent(sessionId, next);
          }}
          placeholder={
            questions
              ? "Or answer in your own words…"
              : request
                ? "Or tell Claude what to do instead…"
                : working
                  ? "Queue a message for Claude…"
                  : live.exit?.missingWorktree
                    ? "This task can't run anymore"
                    : live.exit
                      ? "Reply to restart Claude…"
                      : endedAt !== null
                        ? "Reply to resume…"
                        : "Reply to Claude…"
          }
          state={(working || busyCompacting) && !request ? "working" : "idle"}
          files={files}
          commands={commands}
          onSubmit={({ text, attachments }) => {
            if (request && questions) {
              answerQuestions(text);
              return;
            }
            if (request) {
              void answer(request.id, { behavior: "deny", message: text });
              return;
            }
            const typedSetting = slashSettings(text, models);
            if (typedSetting) {
              changeSettings({ ...(knownSettings.get(sessionId) ?? settings), ...typedSetting });
              return;
            }
            clearAgentExit(sessionId);
            setInterruptedAt(null);
            if (endedAt !== null) resume();
            const isCommand = text.trimStart().startsWith("/");
            const content = agentMessage(text, attachments);
            if (working && !isCommand) {
              setQueued((current) => [
                ...current,
                { id: crypto.randomUUID(), text: messageText(text, attachments), content },
              ]);
              return;
            }
            if (!isCommand) {
              setAgentRunning(sessionId, true);
              showSending(messageText(text, attachments));
            }
            void content.then((message) => window.api.agentSend(sessionId, message));
          }}
          onStop={interrupt}
        />
      )}
    </div>
  );
}
