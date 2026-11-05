import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Ban,
  CircleHelp,
  Cpu,
  Eye,
  File as FileIcon,
  Folder,
  GitCommitHorizontal,
  Globe,
  ImageIcon,
  MapIcon,
  PenLine,
  Plug,
  RefreshCw,
  Search,
  Slash,
  Sparkles,
  Terminal,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Expand } from "@/components/atoms/expand";
import { LogoTile } from "@/components/atoms/logo-tile";
import {
  ParallelAgents,
  PullRequestCard,
  SubagentCard,
  SystemDivider,
  SystemRow,
  TodoPlan,
  TurnSummary,
  UsageLimitCard,
  type TodoState,
} from "@/components/task/block-cards";
import {
  BlockNote,
  BlockRow,
  BlockTag,
  DiffLines,
  FileList,
  GrepMatches,
  ImagePreview,
  OutputLines,
  WebResults,
  type BlockIcon,
} from "@/components/task/blocks";
import {
  ContextMeter,
  QueuedMessage,
  ResponseActions,
  ThinkingLine,
  ThoughtToggle,
} from "@/components/task/agent-flow";
import { UserBubble } from "@/components/task/conversation";
import { ConversationSearch } from "@/components/task/conversation-search";
import { JumpToLatest } from "@/components/task/jump-to-latest";
import { MessageImages } from "@/components/task/message-images";
import { MarkdownText } from "@/components/task/markdown-text";
import { useRevealedLength } from "@/hooks/use-revealed-length";
import { useNow } from "@/hooks/use-now";
import { useSettled } from "@/hooks/use-settled";
import { useTextSearch } from "@/hooks/use-text-search";
import {
  partialField,
  type AgentExit,
  type ApiRetry,
  type LiveBlock,
  type SubagentStep,
} from "@/lib/agent-live";
import { describeTool, formatDuration, relativePath, type ToolIcon } from "@/lib/tool-display";
import type { ConversationItem, ToolCall, TodoStatus } from "@/lib/transcript";
import { exactTime, relativeTimeLong } from "@/lib/relative-time";
import { compactTokens } from "@/lib/usage";
import { cn } from "@/lib/utils";

const ICONS: Record<ToolIcon, BlockIcon> = {
  read: Eye,
  write: FileIcon,
  edit: PenLine,
  bash: Terminal,
  search: Search,
  find: Folder,
  web: Globe,
  agent: Cpu,
  skill: Sparkles,
  question: CircleHelp,
  plug: Plug,
  tool: Wrench,
  error: TriangleAlert,
  denied: Ban,
  commit: GitCommitHorizontal,
  plan: MapIcon,
  image: ImageIcon,
};

const TODO_STATE: Record<TodoStatus, TodoState> = {
  completed: "done",
  in_progress: "active",
  pending: "todo",
};

const STICK_THRESHOLD_PX = 48;
const THINKING_DELAY_MS = 400;
const VISIBLE_OUTPUT_LINES = 8;
const SUBAGENT_STEPS = 3;
const CONTEXT_WARNING = 80;
const ANSWERED_IN_CARD = new Set(["AskUserQuestion", "ExitPlanMode"]);
const EDIT_TOOLS = new Set(["Edit", "MultiEdit", "Write", "NotebookEdit"]);

export interface ConversationActions {
  onCloseTask?: () => void;
  onOpenImages?: (images: readonly string[], index: number) => void;
  onRetryOnline?: () => void;
  onResume?: () => void;
  onStartFresh?: () => void;
  onOpenInTerminal?: (command: string) => void;
  onOpenUrl?: (url: string) => void;
  onViewChanges?: () => void;
  onCompact?: () => void;
  onRestart?: () => void;
}

function stepRows(steps: readonly SubagentStep[], cwd: string) {
  return steps.slice(-SUBAGENT_STEPS).map((step) => {
    const display = describeTool({ id: step.id, name: step.name, input: step.input }, cwd);
    return {
      icon: ICONS[display.icon],
      verb: step.done ? display.verb : display.runningVerb,
      target: display.target || step.name,
      running: !step.done,
      prose: display.prose,
    };
  });
}

function ToolBlock({
  call,
  cwd,
  live,
  steps,
  branch,
  base,
  actions,
}: {
  call: ToolCall;
  cwd: string;
  live: boolean;
  steps?: readonly SubagentStep[];
  branch: string;
  base: string;
  actions: ConversationActions;
}) {
  const display = describeTool(call, cwd);
  const [open, setOpen] = useState<boolean | null>(null);
  const now = useNow(live && !call.result && steps ? 1000 : 60_000);
  const running = live && !call.result;

  if (!call.result && ANSWERED_IN_CARD.has(call.name)) return null;
  if (running && steps?.length) {
    const seconds = call.startedAt ? Math.round((now - Date.parse(call.startedAt)) / 1000) : 0;
    return (
      <SubagentCard
        name={display.verb}
        task={display.target}
        meta={[
          `${steps.length} ${steps.length === 1 ? "tool" : "tools"}`,
          seconds > 0 && `${seconds}s`,
        ]
          .filter(Boolean)
          .join(" · ")}
        steps={stepRows(steps, cwd)}
      />
    );
  }
  if (running)
    return (
      <BlockRow running verb={display.runningVerb} target={display.target} prose={display.prose} />
    );
  if (display.pullRequest) {
    const pr = display.pullRequest;
    return (
      <PullRequestCard
        title={pr.title}
        number={pr.number}
        branch={pr.branch ?? branch}
        base={pr.base ?? base}
        onOpen={() => actions.onOpenUrl?.(pr.url)}
      />
    );
  }

  const detail = display.detail;
  const expandable = detail && detail.kind !== "note";
  const shown = open ?? display.openByDefault;
  const command = display.command;
  return (
    <div className="flex flex-col">
      <BlockRow
        icon={ICONS[display.icon]}
        lead={display.lead ? <LogoTile size="xs">{display.lead}</LogoTile> : undefined}
        tone={display.tone}
        verbMuted={display.muted}
        verb={display.verb}
        target={display.target}
        prose={display.prose}
        aside={display.aside}
        tags={
          display.newFile ? (
            <BlockTag tone="new">new</BlockTag>
          ) : display.tag ? (
            <BlockTag mono>{display.tag}</BlockTag>
          ) : undefined
        }
        diff={display.diff}
        meta={display.meta}
        metaTone={display.metaTone}
        chevron={expandable ? (shown ? "down" : "right") : undefined}
        onToggle={expandable ? () => setOpen(!shown) : undefined}
      />
      {display.note && <BlockNote mono={display.note.mono}>{display.note.text}</BlockNote>}
      {detail?.kind === "note" && <BlockNote>{detail.text}</BlockNote>}
      {expandable && (
        <Expand open={shown}>
          <div className={cn("flex flex-col", display.note && "mt-1.5")}>
            {detail.kind === "diff" && <DiffLines lines={detail.lines} />}
            {detail.kind === "output" && (
              <OutputLines
                lines={detail.lines}
                visible={VISIBLE_OUTPUT_LINES}
                onOpenInTerminal={
                  command && actions.onOpenInTerminal
                    ? () => actions.onOpenInTerminal?.(command)
                    : undefined
                }
              />
            )}
            {detail.kind === "matches" && (
              <GrepMatches term={detail.term} matches={detail.matches} />
            )}
            {detail.kind === "files" && <FileList files={detail.files} />}
            {detail.kind === "web" && (
              <WebResults results={detail.results} onOpen={actions.onOpenUrl} />
            )}
            {detail.kind === "image" && <ImagePreview src={detail.src} alt={display.target} />}
          </div>
        </Expand>
      )}
    </div>
  );
}

const isFinished = (call: ToolCall) =>
  Boolean(call.result) &&
  (call.result?.data?.status !== "async_launched" || Boolean(call.backgroundStatus));

function AgentsBlock({ calls, cwd }: { calls: ToolCall[]; cwd: string }) {
  const done = calls.filter(isFinished).length;
  const [open, setOpen] = useState<boolean | null>(null);
  const shown = open ?? done < calls.length;
  return (
    <div className="flex flex-col">
      <BlockRow
        icon={Cpu}
        verb={`${calls.length} agents`}
        target={<span className="text-ink-4">in parallel</span>}
        prose
        meta={`${done} of ${calls.length} done`}
        chevron={shown ? "down" : "right"}
        onToggle={() => setOpen(!shown)}
      />
      <Expand open={shown}>
        <ParallelAgents
          agents={calls.map((call) => {
            const display = describeTool(call, cwd);
            return {
              name: display.verb,
              task: display.target,
              meta: display.meta ?? "",
              done: isFinished(call),
            };
          })}
        />
      </Expand>
    </div>
  );
}

const SHORT_OUTPUT_CHARS = 90;

function CommandBlock({ name, output }: { name: string; output?: string }) {
  const [open, setOpen] = useState(true);
  const short = output && !output.includes("\n") && output.length <= SHORT_OUTPUT_CHARS;
  if (!output || short) {
    return (
      <div className="flex flex-col">
        <BlockRow icon={Slash} verb="Ran" target={name} />
        {short && <BlockNote>{output}</BlockNote>}
      </div>
    );
  }
  const lines = output.split("\n");
  return (
    <div className="flex flex-col">
      <BlockRow
        icon={Slash}
        verb="Ran"
        target={name}
        chevron={open ? "down" : "right"}
        onToggle={() => setOpen(!open)}
      />
      <Expand open={open}>
        <OutputLines
          lines={lines.map((text) => ({ text, tone: "ink" as const }))}
          visible={VISIBLE_OUTPUT_LINES * 2}
        />
      </Expand>
    </div>
  );
}

function ReadsBlock({ calls, cwd }: { calls: ToolCall[]; cwd: string }) {
  const [open, setOpen] = useState(false);
  const lineCount = (call: ToolCall) =>
    Number((call.result?.data?.file as { numLines?: number } | undefined)?.numLines ?? 0);
  const total = calls.reduce((sum, call) => sum + lineCount(call), 0);
  return (
    <div className="flex flex-col">
      <BlockRow
        icon={Eye}
        verb="Read"
        target={`${calls.length} files`}
        meta={total ? `${total} lines` : undefined}
        chevron={open ? "down" : "right"}
        onToggle={() => setOpen(!open)}
      />
      <Expand open={open}>
        <FileList
          files={calls.map((call) => ({
            path: relativePath(String(call.input.file_path ?? ""), cwd),
            meta: lineCount(call) ? String(lineCount(call)) : "",
          }))}
        />
      </Expand>
    </div>
  );
}

function ThoughtBlock({ text, seconds }: { text: string; seconds: number }) {
  const [open, setOpen] = useState(false);
  if (!text) return <ThoughtToggle seconds={seconds} />;
  return (
    <div className="flex flex-col">
      <ThoughtToggle seconds={seconds} open={open} onToggle={() => setOpen(!open)} />
      <Expand open={open}>
        <div className="mt-1 border-l-2 border-line-chip pl-3 text-xs leading-[18px] whitespace-pre-wrap text-ink-4 select-text">
          {text}
        </div>
      </Expand>
    </div>
  );
}

function CompactedBlock({
  before,
  after,
  summary,
}: {
  before?: number;
  after?: number;
  summary?: string;
}) {
  const [open, setOpen] = useState(false);
  const tokens =
    before !== undefined && after !== undefined
      ? ` · ${compactTokens(before)} → ${compactTokens(after)} tokens`
      : "";
  return (
    <div className="flex flex-col">
      <SystemDivider>
        Context compacted{tokens}
        {summary && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="interactive press cursor-pointer text-ink-3 select-none hover:text-ink-2"
          >
            · {open ? "Hide summary" : "View summary"}
          </button>
        )}
      </SystemDivider>
      {summary && (
        <Expand open={open}>
          <div className="mt-1 rounded-control bg-inset px-3.5 py-3 text-xs shadow-[inset_0_0_0_1px_var(--line-soft)] select-text">
            <MarkdownText text={summary} />
          </div>
        </Expand>
      )}
    </div>
  );
}

const LIMIT_RESET = /resets?\s+(?:at\s+)?([^·.\n|()]+)/i;
const LIMIT_EPOCH = /\|(\d{10})\b/;

function limitReset(text: string): string | undefined {
  const epoch = text.match(LIMIT_EPOCH)?.[1];
  if (epoch) {
    return new Date(Number(epoch) * 1000).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return text.match(LIMIT_RESET)?.[1].trim();
}

function Item({
  item,
  cwd,
  live,
  subagents,
  branch,
  base,
  actions,
}: {
  item: ConversationItem;
  cwd: string;
  live: boolean;
  subagents: Record<string, SubagentStep[]>;
  branch: string;
  base: string;
  actions: ConversationActions;
}) {
  switch (item.kind) {
    case "user":
      return (
        <div className="flex flex-col gap-2">
          {item.images?.length ? (
            <MessageImages
              images={item.images}
              onOpen={(index) => actions.onOpenImages?.(item.images ?? [], index)}
            />
          ) : null}
          {item.text && (
            <UserBubble>
              <span className="whitespace-pre-wrap select-text">{item.text}</span>
            </UserBubble>
          )}
        </div>
      );
    case "text":
      return (
        <div className="select-text">
          <MarkdownText text={item.text} />
        </div>
      );
    case "tool":
      return (
        <ToolBlock
          call={item.call}
          cwd={cwd}
          live={live}
          steps={subagents[item.call.id]}
          branch={branch}
          base={base}
          actions={actions}
        />
      );
    case "reads":
      return <ReadsBlock calls={item.calls} cwd={cwd} />;
    case "agents":
      return <AgentsBlock calls={item.calls} cwd={cwd} />;
    case "todos":
      return (
        <TodoPlan
          items={item.todos.map((todo) => ({
            label: todo.label,
            state: TODO_STATE[todo.status],
          }))}
        />
      );
    case "command":
      return <CommandBlock name={item.name} output={item.output} />;
    case "divider":
      return <SystemDivider>{item.label}</SystemDivider>;
    case "compacted":
      return <CompactedBlock before={item.before} after={item.after} summary={item.summary} />;
    case "thought":
      return <ThoughtBlock text={item.text} seconds={item.seconds} />;
    case "limit":
      return (
        <UsageLimitCard
          resets={limitReset(item.text)}
          body="Claude stopped here. Send a message once the limit resets to pick it up again."
        />
      );
  }
}

function turnChanges(items: readonly ConversationItem[], cwd: string) {
  const files = new Set<string>();
  let added = 0;
  let removed = 0;
  for (const item of items) {
    if (item.kind !== "tool" || !EDIT_TOOLS.has(item.call.name) || item.call.result?.isError)
      continue;
    const path = String(item.call.input.file_path ?? item.call.input.notebook_path ?? "");
    if (!path.startsWith(`${cwd}/`)) continue;
    const display = describeTool(item.call, "");
    if (!display.diff) continue;
    files.add(display.target);
    added += display.diff.added ?? 0;
    removed += display.diff.removed ?? 0;
  }
  return files.size ? { files: files.size, diff: { added, removed } } : null;
}

function RetryRow({ retry }: { retry: ApiRetry }) {
  const now = useNow(1000);
  const wait = Math.max(0, retry.retryAt - now);
  return (
    <BlockRow
      lead={<RefreshCw width={12} height={12} strokeWidth={2} className="animate-spin" />}
      tone="orange"
      verb="Retrying"
      target={retry.error.replace(/_/g, " ")}
      prose
      meta={[
        wait > 0 && `in ${formatDuration(wait)}`,
        retry.maxRetries > 0 && `attempt ${retry.attempt} of ${retry.maxRetries}`,
      ]
        .filter(Boolean)
        .join(" · ")}
      metaTone="orange"
    />
  );
}

function ExitRow({
  exit,
  onRestart,
  onCloseTask,
}: {
  exit: AgentExit;
  onRestart?: () => void;
  onCloseTask?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const now = useNow(60_000);
  if (exit.missingWorktree) {
    return (
      <SystemRow
        kind="crashed"
        title="This task's worktree is gone"
        description="Its folder was deleted. Close it and start a new task."
        actions={[{ label: "Close task", primary: true, onClick: onCloseTask }]}
      />
    );
  }
  const log = exit.log.split("\n").filter(Boolean);
  return (
    <div className="flex flex-col">
      <SystemRow
        kind="crashed"
        title="Claude Code exited unexpectedly"
        description={`${exit.code === null ? "It stopped" : `Exit code ${exit.code}`} · ${relativeTimeLong(exit.at, now)}. Your changes are safe in the worktree.`}
        actions={[
          ...(log.length
            ? [{ label: open ? "Hide log" : "View log", onClick: () => setOpen(!open) }]
            : []),
          { label: "Restart", primary: true, onClick: onRestart },
        ]}
      />
      {log.length > 0 && (
        <Expand open={open}>
          <OutputLines
            lines={log.map((text) => ({ text, tone: "red" as const }))}
            visible={VISIBLE_OUTPUT_LINES * 2}
          />
        </Expand>
      )}
    </div>
  );
}

const BLURRED_TAIL = 6;

function LiveText({ text }: { text: string }) {
  const shown = text.slice(0, useRevealedLength(text));
  const split = Math.max(0, shown.length - BLURRED_TAIL);
  return (
    <div className="select-text">
      <MarkdownText text={shown.slice(0, split)} streamTail={shown.slice(split)} />
    </div>
  );
}

function LiveBlockView({ block, cwd }: { block: LiveBlock; cwd: string }) {
  if (block.kind === "text") return <LiveText text={block.text} />;
  if (block.kind === "tool") {
    const input = Object.fromEntries(
      ["command", "description", "file_path", "pattern", "url", "query"].map((field) => [
        field,
        partialField(block.json, field),
      ]),
    );
    const display = describeTool({ id: "live", name: block.name, input }, cwd);
    return (
      <BlockRow running verb={display.runningVerb} target={display.target} prose={display.prose} />
    );
  }
  return null;
}

function edgeMask(above: boolean, below: boolean): string | undefined {
  if (!above && !below) return undefined;
  const top = above ? "transparent 0, black 48px" : "black 0";
  const bottom = below ? "black calc(100% - 72px), transparent 100%" : "black 100%";
  return `linear-gradient(to bottom, ${top}, ${bottom})`;
}

function responses(items: readonly ConversationItem[]): number[][] {
  const groups: number[][] = [];
  items.forEach((item, index) => {
    const current = groups.at(-1);
    const startsGroup = item.kind === "user" || !current || items[current[0]].kind === "user";
    if (startsGroup) groups.push([index]);
    else current.push(index);
  });
  return groups;
}

function isToolRow(item: ConversationItem | undefined) {
  return (
    item?.kind === "tool" ||
    item?.kind === "reads" ||
    item?.kind === "agents" ||
    item?.kind === "command"
  );
}

export function AgentConversation({
  items,
  cwd,
  working,
  thinkingSeconds,
  thinkingTokens,
  liveBlocks,
  subagents = {},
  retry = null,
  compacting = false,
  interrupting = false,
  exit = null,
  offline = false,
  endedAt = null,
  context = null,
  branch,
  base,
  sending = [],
  queued = [],
  onQueuedSend,
  onQueuedEdit,
  onQueuedCancel,
  actions = {},
  searchable = false,
  footer,
  className,
}: {
  searchable?: boolean;
  items: readonly ConversationItem[];
  cwd: string;
  working: boolean;
  thinkingSeconds: number;
  thinkingTokens: number;
  liveBlocks: readonly LiveBlock[];
  subagents?: Record<string, SubagentStep[]>;
  retry?: ApiRetry | null;
  compacting?: boolean;
  interrupting?: boolean;
  exit?: AgentExit | null;
  offline?: boolean;
  endedAt?: number | null;
  context?: number | null;
  branch: string;
  base: string;
  sending?: readonly { id: string; text: string }[];
  queued?: readonly { id: string; text: string }[];
  onQueuedSend?: (id: string) => void;
  onQueuedEdit?: (id: string) => void;
  onQueuedCancel?: (id: string) => void;
  actions?: ConversationActions;
  footer?: ReactNode;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stuckRef = useRef(true);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const itemActions = actions;
  const search = useTextSearch(scrollerRef);
  const closeSearch = () => {
    setSearchQuery(null);
    search.reset();
  };
  const [searchFocus, setSearchFocus] = useState(0);
  useHotkey(
    "Mod+F",
    () => {
      setSearchQuery((query) => query ?? "");
      setSearchFocus((count) => count + 1);
    },
    { enabled: searchable },
  );
  const now = useNow(60_000);
  const [leftAt, setLeftAt] = useState<number | null>(null);
  const [moreAbove, setMoreAbove] = useState(false);
  const [seen, setSeen] = useState<ReadonlySet<string> | null>(null);
  if (seen === null && items.length > 0) setSeen(new Set(items.map((item) => item.id)));
  const [shownSending, setShownSending] = useState<ReadonlySet<string>>(new Set());
  const sendingTexts = new Set(sending.map((message) => message.text));
  if (sending.some((message) => !shownSending.has(message.text))) {
    setShownSending(new Set([...shownSending, ...sendingTexts]));
  }
  const entrance = (item: ConversationItem) => {
    if (!seen || seen.has(item.id) || item.kind === "text" || item.kind === "divider")
      return undefined;
    if (item.kind === "user") return shownSending.has(item.text) ? undefined : "enter-message";
    return "enter-step";
  };
  const stickToBottom = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (stuckRef.current) scroller.scrollTop = scroller.scrollHeight;
    setMoreAbove(scroller.scrollTop > 0);
  };
  const jumpToLatest = () => {
    const scroller = scrollerRef.current;
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
  };
  const last = items.at(-1);
  const turnStart = items.findLastIndex((item) => item.kind === "user");
  const writing = liveBlocks.some((block) => block.kind !== "thinking");
  const waitingForClaude = working && !writing && !(last?.kind === "tool" && !last.call.result);
  const justSent = sending.length > 0 || last?.kind === "user";
  const settledWorking = useSettled(waitingForClaude, THINKING_DELAY_MS);
  const showWorking = waitingForClaude && (justSent || settledWorking);

  const sentCount = useRef(sending.length + queued.length);
  useLayoutEffect(() => {
    const count = sending.length + queued.length;
    if (count > sentCount.current) stuckRef.current = true;
    sentCount.current = count;
  }, [sending.length, queued.length]);
  useLayoutEffect(stickToBottom, [
    items,
    showWorking,
    footer,
    liveBlocks,
    sending,
    queued,
    exit,
    compacting,
    offline,
    endedAt,
  ]);

  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const keepAtBottom = new ResizeObserver(() => {
      if (stuckRef.current) scroller.scrollTop = scroller.scrollHeight;
    });
    keepAtBottom.observe(content);
    keepAtBottom.observe(scroller);
    return () => keepAtBottom.disconnect();
  }, []);

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      {searchQuery !== null && (
        <ConversationSearch
          query={searchQuery}
          focusRequest={searchFocus}
          current={search.current}
          total={search.total}
          onQueryChange={(query) => {
            setSearchQuery(query);
            search.search(query);
          }}
          onStep={(delta) => search.step(searchQuery, delta)}
          onClose={closeSearch}
        />
      )}
      <div
        ref={scrollerRef}
        onScroll={(event) => {
          const scroller = event.currentTarget;
          const atBottom =
            scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < STICK_THRESHOLD_PX;
          stuckRef.current = atBottom;
          setMoreAbove(scroller.scrollTop > 0);
          if (atBottom && leftAt !== null) setLeftAt(null);
          if (!atBottom && leftAt === null) setLeftAt(items.length);
        }}
        style={{ maskImage: edgeMask(moreAbove, leftAt !== null) }}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[18px] pt-4 pb-2.5 select-text [cursor:default]"
      >
        <div ref={contentRef} className="mt-auto flex flex-col">
          {responses(items).map((group, groupIndex, groups) => {
            const rows = group.map((index) => (
              <div
                key={items[index].id}
                className={cn(
                  "flex flex-col",
                  index > 0 &&
                    (isToolRow(items[index]) && isToolRow(items[index - 1]) ? "mt-0.5" : "mt-3"),
                  entrance(items[index]),
                )}
              >
                <Item
                  item={items[index]}
                  cwd={cwd}
                  live={working && index > turnStart}
                  subagents={subagents}
                  branch={branch}
                  base={base}
                  actions={itemActions}
                />
              </div>
            ));
            const texts = group.map((index) => items[index]).filter((item) => item.kind === "text");
            const lastText = texts.at(-1);
            const streaming =
              (working || interrupting) && groupIndex === groups.length - 1 && sending.length === 0;
            const lastInGroup = items[group[group.length - 1]];
            const interrupted =
              lastInGroup.kind === "divider" && lastInGroup.label === "Interrupted by you";
            if (items[group[0]].kind === "user" || !lastText || streaming || interrupted) {
              return <Fragment key={items[group[0]].id}>{rows}</Fragment>;
            }
            const at = lastText.at ? Date.parse(lastText.at) : null;
            const changes = turnChanges(
              group.map((index) => items[index]),
              cwd,
            );
            return (
              <div key={items[group[0]].id} className="group/response flex flex-col">
                {rows}
                {changes && (
                  <div className="mt-3">
                    <TurnSummary
                      files={changes.files}
                      diff={changes.diff}
                      onView={actions.onViewChanges}
                    />
                  </div>
                )}
                <div className="mt-2">
                  <ResponseActions
                    text={texts.map((item) => item.text).join("\n\n")}
                    time={at ? relativeTimeLong(at, now) : ""}
                    exact={at ? exactTime(at) : ""}
                  />
                </div>
              </div>
            );
          })}
          {sending.map((message) => (
            <div key={message.id} className="enter-message mt-3 flex flex-col">
              <UserBubble>
                <span className="whitespace-pre-wrap select-text">{message.text}</span>
              </UserBubble>
            </div>
          ))}
          {queued.map((message) => (
            <div key={message.id} className="enter-message mt-3 flex flex-col">
              <QueuedMessage
                onSendNow={() => onQueuedSend?.(message.id)}
                onEdit={() => onQueuedEdit?.(message.id)}
                onCancel={() => onQueuedCancel?.(message.id)}
              >
                {message.text}
              </QueuedMessage>
            </div>
          ))}
          {working &&
            liveBlocks
              .filter((block) => block.kind !== "thinking")
              .map((block) => (
                <div key={block.index} className={cn("enter-step", items.length > 0 && "mt-3")}>
                  <LiveBlockView block={block} cwd={cwd} />
                </div>
              ))}
          {interrupting && !working && (
            <div className={cn(items.length > 0 && "mt-3")}>
              <SystemDivider>Interrupted by you</SystemDivider>
            </div>
          )}
          {working && retry && (
            <div className={cn("enter-step", items.length > 0 && "mt-3")}>
              <RetryRow retry={retry} />
            </div>
          )}
          {compacting && (
            <div className={cn("enter-step", items.length > 0 && "mt-3")}>
              <BlockRow running verb="Compacting conversation" meta="esc to cancel" />
            </div>
          )}
          {showWorking && !footer && !retry && !compacting && (
            <div className={cn("enter-step", items.length > 0 && "mt-3")}>
              <ThinkingLine seconds={thinkingSeconds} tokens={thinkingTokens} />
            </div>
          )}
          {offline && (
            <div className={cn("enter-step", items.length > 0 && "mt-3")}>
              <SystemRow
                kind="offline"
                title="You're offline"
                description="Claude keeps working locally. Links and connectors wait."
                actions={[{ label: "Retry", primary: true, onClick: actions.onRetryOnline }]}
              />
            </div>
          )}
          {endedAt !== null && !working && !exit && (
            <div className={cn("enter-step", items.length > 0 && "mt-3")}>
              <SystemRow
                kind="ended"
                title={`This session ended ${relativeTimeLong(endedAt, now)}`}
                description="Resume to keep the conversation and context."
                actions={[
                  { label: "Start fresh", onClick: actions.onStartFresh },
                  { label: "Resume", primary: true, onClick: actions.onResume },
                ]}
              />
            </div>
          )}
          {exit && !working && (
            <div className={cn("enter-step", items.length > 0 && "mt-3")}>
              <ExitRow
                exit={exit}
                onRestart={actions.onRestart}
                onCloseTask={actions.onCloseTask}
              />
            </div>
          )}
          {!working && !footer && context !== null && context >= CONTEXT_WARNING && (
            <div className={cn("enter-step", items.length > 0 && "mt-3")}>
              <ContextMeter percent={context} onCompact={actions.onCompact} />
            </div>
          )}
          {footer && <div className={cn("enter-step", items.length > 0 && "mt-3")}>{footer}</div>}
        </div>
      </div>
      {leftAt !== null && (
        <JumpToLatest
          newSteps={Math.max(0, items.length - leftAt)}
          needsYou={Boolean(footer)}
          onClick={jumpToLatest}
          className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2"
        />
      )}
    </div>
  );
}
