import type { ToolCall } from "@/lib/transcript";

export type ToolIcon =
  | "read"
  | "write"
  | "edit"
  | "bash"
  | "search"
  | "find"
  | "web"
  | "agent"
  | "skill"
  | "question"
  | "plug"
  | "tool"
  | "error"
  | "denied"
  | "commit"
  | "plan"
  | "image";

export type ToolTone = "muted" | "red" | "accent";

export type DiffRow = { n?: number; sign: "+" | "-" | " "; code: string };

export type ToolDetail =
  | { kind: "diff"; lines: DiffRow[] }
  | { kind: "output"; lines: { text: string; tone?: "red" }[]; hidden: number }
  | { kind: "note"; text: string; mono?: boolean }
  | { kind: "matches"; term: string; matches: { location: string; line: string }[] }
  | { kind: "files"; files: { path: string; meta: string }[] }
  | { kind: "web"; results: { letter: string; title: string; domain: string; url: string }[] }
  | { kind: "image"; src: string };

export interface PullRequest {
  title: string;
  number: number;
  url: string;
  branch?: string;
  base?: string;
}

export interface ToolDisplay {
  icon: ToolIcon;
  lead?: string;
  tone: ToolTone;
  muted?: boolean;
  verb: string;
  runningVerb: string;
  target: string;
  prose: boolean;
  aside?: string;
  tag?: string;
  newFile?: boolean;
  diff?: { added?: number; removed?: number };
  meta?: string;
  metaTone?: "muted" | "red" | "green";
  detail?: ToolDetail;
  note?: { text: string; mono?: boolean };
  command?: string;
  pullRequest?: PullRequest;
  openByDefault: boolean;
}

const OUTPUT_LINES = 8;
const WRITE_PREVIEW_LINES = 40;
const DETAIL_ROWS = 20;
const EXIT_LINE = /^Exit code \d+\n?/;
const DENIED = /^The user (denied|doesn't want to proceed)/;
const COMMIT_LINE = /^\[([^\]\s]+)(?: \(root-commit\))? ([0-9a-f]{7,})\] (.+)$/m;
const FILES_CHANGED = /(\d+) files? changed/;
const PR_URL = /https:\/\/github\.com\/\S+\/pull\/(\d+)/;
const PR_TITLE = /(?:--title|-t)\s+(?:"((?:[^"\\]|\\.)*)"|'([^']*)')/;
const PR_HEAD = /(?:--head|-H)\s+["']?([^\s"']+)/;
const PR_BASE = /(?:--base|-B)\s+["']?([^\s"']+)/;
const NEW_BRANCH =
  /\b(?:checkout\s+-b|switch\s+-c|push\s+(?:-u|--set-upstream)\s+\S+)\s+["']?([^\s"';&|]+)/;
const GREP_LINE = /^(.+?)[:-](\d+)[:-](.*)$/;
const COMMIT_HOOK = /\b(pre-commit|commit-msg|prepare-commit-msg|husky|lint-staged)\b|\bhooks?\b/i;
const HOOK_NAME = /\b(pre-commit|commit-msg|prepare-commit-msg)\b/i;
const HOOK_RUNNER = /\b(lint-staged|husky)\b/i;
const HOOK_SUMMARY = /^husky\s+-\s|^hint:|^error: failed to push/i;
const HOOK_ERROR = /error|✖|✗|failed|fatal|not allowed|must|invalid/i;
const CELL_INDEX = /^cell-(\d+)$/;
const NOTEBOOK_VERBS: Record<string, [string, string]> = {
  insert: ["Add cell to", "Adding cell to"],
  delete: ["Delete cell in", "Deleting cell in"],
  replace: ["Edit", "Editing"],
};
const MAX_DIFF_CELLS = 250_000;
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[ -/]*[@-~]`, "g");

const text = (value: unknown) => (typeof value === "string" ? value : "");
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const HOME = /^\/Users\/[^/]+(?=\/)/;

export function relativePath(path: string, cwd: string): string {
  if (cwd && path.startsWith(`${cwd}/`)) return path.slice(cwd.length + 1);
  return path.replace(HOME, "~");
}

function firstLine(value: string, max = 72): string {
  const line = value.trim().split("\n")[0] ?? "";
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

export function dedent(lines: readonly string[]): string[] {
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^[ \t]*/)?.[0].length ?? 0);
  const common = indents.length ? Math.min(...indents) : 0;
  return common ? lines.map((line) => line.slice(common)) : [...lines];
}

function outputDetail(raw: string, isError: boolean): ToolDetail | undefined {
  const lines = dedent(
    raw
      .replace(ANSI, "")
      .replace(/\s+$/, "")
      .replace(/^\s*\n/, "")
      .split("\n"),
  );
  if (lines.length === 1 && !lines[0]) return undefined;
  return {
    kind: "output",
    lines: lines.map((line) => ({ text: line, tone: isError ? "red" : undefined })),
    hidden: Math.max(0, lines.length - OUTPUT_LINES),
  };
}

const INSTANT_MS = 100;

export function formatDuration(ms: number): string {
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)}s`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function durationOf(call: ToolCall): number | null {
  const reported = Number(call.result?.data?.durationMs ?? call.result?.data?.totalDurationMs);
  if (reported > 0) return reported;
  if (!call.startedAt || !call.endedAt) return null;
  const ms = Date.parse(call.endedAt) - Date.parse(call.startedAt);
  return ms >= 0 ? ms : null;
}

function grepDetail(data: Record<string, unknown> | null, pattern: string, cwd: string) {
  if (!data) return undefined;
  const content = text(data.content);
  if (data.mode === "content" && content) {
    const matches = content
      .split("\n")
      .filter(Boolean)
      .slice(0, DETAIL_ROWS)
      .map((line) => {
        const parts = line.match(GREP_LINE);
        return parts
          ? { location: `${relativePath(parts[1], cwd)}:${parts[2]}`, line: parts[3].trim() }
          : { location: "", line: line.trim() };
      });
    return { kind: "matches", term: pattern, matches } satisfies ToolDetail;
  }
  return filesDetail(data.filenames, cwd);
}

function filesDetail(filenames: unknown, cwd: string): ToolDetail | undefined {
  if (!Array.isArray(filenames) || filenames.length === 0) return undefined;
  return {
    kind: "files",
    files: filenames.slice(0, DETAIL_ROWS).map((path) => ({
      path: relativePath(String(path), cwd),
      meta: "",
    })),
  };
}

function webResults(data: Record<string, unknown> | null): ToolDetail | undefined {
  const results = Array.isArray(data?.results) ? data.results : [];
  const links = results
    .flatMap((result: { content?: { title?: string; url?: string }[] } | string) =>
      typeof result === "string" ? [] : (result.content ?? []),
    )
    .filter((link) => link.url);
  if (links.length === 0) return undefined;
  const seen = new Set<string>();
  return {
    kind: "web",
    results: links
      .filter((link) => !seen.has(link.url!) && seen.add(link.url!))
      .slice(0, DETAIL_ROWS)
      .map((link) => {
        const domain = hostname(link.url!);
        return {
          letter: domain.charAt(0).toUpperCase(),
          title: link.title || domain,
          domain,
          url: link.url!,
        };
      }),
  };
}

function shortPaths(command: string, cwd: string): string {
  return cwd ? command.replaceAll(`${cwd}/`, "").replaceAll(cwd, ".") : command;
}

function commandArgument(command: string, pattern: RegExp): string {
  const match = command.match(pattern);
  return (match?.[1] ?? match?.[2] ?? "").replace(/\\"/g, '"');
}

interface PatchHunk {
  oldStart?: number;
  newStart?: number;
  lines?: string[];
}

export function patchRows(hunks: readonly PatchHunk[]): DiffRow[] {
  const rows: DiffRow[] = [];
  for (const hunk of hunks) {
    let oldLine = hunk.oldStart ?? 1;
    let newLine = hunk.newStart ?? 1;
    for (const line of hunk.lines ?? []) {
      const sign = line[0] === "+" || line[0] === "-" ? line[0] : " ";
      const code = line.slice(1);
      if (sign === "-") rows.push({ n: oldLine++, sign, code });
      else {
        rows.push({ n: newLine++, sign, code });
        if (sign === " ") oldLine++;
      }
    }
  }
  return rows;
}

function countRows(rows: readonly DiffRow[]) {
  return {
    added: rows.filter((row) => row.sign === "+").length,
    removed: rows.filter((row) => row.sign === "-").length,
  };
}

export function lineDiff(before: readonly string[], after: readonly string[]): DiffRow[] {
  if (before.length * after.length > MAX_DIFF_CELLS) {
    return [
      ...before.map((code, index) => ({ n: index + 1, sign: "-" as const, code })),
      ...after.map((code, index) => ({ n: index + 1, sign: "+" as const, code })),
    ];
  }
  const common = Array.from({ length: before.length + 1 }, () =>
    Array<number>(after.length + 1).fill(0),
  );
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      common[i][j] =
        before[i] === after[j]
          ? common[i + 1][j + 1] + 1
          : Math.max(common[i + 1][j], common[i][j + 1]);
    }
  }
  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      rows.push({ n: j + 1, sign: " ", code: after[j] });
      i++;
      j++;
    } else if (j < after.length && (i >= before.length || common[i][j + 1] >= common[i + 1][j])) {
      rows.push({ n: j + 1, sign: "+", code: after[j] });
      j++;
    } else {
      rows.push({ n: i + 1, sign: "-", code: before[i] });
      i++;
    }
  }
  return rows;
}

interface NotebookCell {
  id?: string;
  source?: string | string[];
}

function notebookCells(raw: unknown): NotebookCell[] {
  if (typeof raw !== "string") return [];
  try {
    const cells = (JSON.parse(raw) as { cells?: unknown }).cells;
    return Array.isArray(cells) ? (cells as NotebookCell[]) : [];
  } catch {
    return [];
  }
}

const sourceLines = (source: string | string[] | undefined) =>
  (Array.isArray(source) ? source.join("") : (source ?? "")).replace(/\n$/, "").split("\n");

function cellIndex(input: Record<string, unknown>, cells: readonly NotebookCell[]): number | null {
  if (typeof input.cell_number === "number") return input.cell_number;
  const id = text(input.cell_id);
  if (!id) return null;
  const found = cells.findIndex((cell) => cell.id === id);
  if (found >= 0) return found;
  const numbered = id.match(CELL_INDEX);
  return numbered ? Number(numbered[1]) : null;
}

function cellNumber(mode: string, index: number | null, anchored: boolean): number | null {
  if (mode !== "insert") return index === null ? null : index + 1;
  if (index !== null) return index + 2;
  return anchored ? null : 1;
}

function notebookEdit(
  base: ToolDisplay,
  input: Record<string, unknown>,
  data: Record<string, unknown> | null,
  path: string,
): ToolDisplay {
  const mode = text(input.edit_mode) || text(data?.edit_mode) || "replace";
  const cells = notebookCells(data?.original_file);
  const index = cellIndex(input, cells);
  const cell = cellNumber(mode, index, Boolean(text(input.cell_id)));
  const oldSource = index !== null && cells[index] ? sourceLines(cells[index].source) : null;
  const newSource = text(input.new_source) || text(data?.new_source);
  const rows =
    mode === "insert"
      ? lineDiff([], sourceLines(newSource))
      : oldSource === null
        ? []
        : lineDiff(oldSource, mode === "delete" ? [] : sourceLines(newSource));
  const [verb, runningVerb] = NOTEBOOK_VERBS[mode] ?? NOTEBOOK_VERBS.replace;
  return {
    ...base,
    icon: "edit",
    verb,
    runningVerb,
    target: path,
    tag: cell === null ? undefined : `cell ${cell}`,
    diff: rows.length ? countRows(rows) : undefined,
    detail: rows.length ? { kind: "diff", lines: rows } : undefined,
  };
}

function hookMessage(output: string): string {
  const lines = output
    .replace(ANSI, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const useful = lines.filter((line) => !HOOK_SUMMARY.test(line));
  return firstLine(
    useful.find((line) => HOOK_ERROR.test(line)) ?? useful[0] ?? lines[0] ?? "",
    200,
  );
}

function hookName(output: string): string {
  return (output.match(HOOK_NAME)?.[1] ?? output.match(HOOK_RUNNER)?.[1] ?? "").toLowerCase();
}

function mcpName(name: string): { server: string; tool: string } {
  const [, server = "", ...rest] = name.split("__");
  const pretty = server
    .replace(/^claude_ai_/, "")
    .replace(/[_-]+/g, " ")
    .trim();
  return { server: pretty.charAt(0).toUpperCase() + pretty.slice(1), tool: rest.join("__") };
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const PLAN_FILE = /\/\.claude\/plans\/([^/]+?)(?:\.md)?$/;

function planFile(call: ToolCall, display: ToolDisplay): ToolDisplay {
  const isPlan = PLAN_FILE.test(text(call.input.file_path));
  if (!isPlan || !["Write", "Edit", "MultiEdit"].includes(call.name)) return display;
  const created = call.name === "Write";
  const content = text(call.input.content);
  return {
    ...display,
    icon: "plan",
    verb: created ? "Wrote plan" : "Updated plan",
    runningVerb: created ? "Writing plan" : "Updating plan",
    target: content ? planTitle(content) : "",
    prose: true,
    newFile: false,
    diff: created ? undefined : display.diff,
  };
}

export function describeTool(call: ToolCall, cwd: string): ToolDisplay {
  return planFile(call, describeCall(call, cwd));
}

function describeCall(call: ToolCall, cwd: string): ToolDisplay {
  const { name, input, result } = call;
  const data = result?.data ?? null;
  const failed = Boolean(result?.isError);
  const base: ToolDisplay = {
    icon: "tool",
    tone: "muted",
    verb: name,
    runningVerb: name,
    target: "",
    prose: false,
    openByDefault: false,
  };
  const path = relativePath(text(input.file_path) || text(input.notebook_path), cwd);

  let display: ToolDisplay;
  switch (name) {
    case "Read": {
      const file = (data?.file ?? null) as { numLines?: number } | null;
      const offset = Number(input.offset ?? 0);
      const limit = Number(input.limit ?? 0);
      display = {
        ...base,
        icon: "read",
        verb: "Read",
        runningVerb: "Reading",
        target: path,
        tag: offset || limit ? `L${offset || 1}–${(offset || 1) + (limit || 0)}` : undefined,
        meta: file?.numLines ? plural(file.numLines, "line") : undefined,
      };
      const image =
        data?.type === "image" ? (data.file as { base64?: string; type?: string }) : null;
      if (image?.base64) {
        display = {
          ...display,
          icon: "image",
          detail: {
            kind: "image",
            src: `data:${image.type ?? "image/png"};base64,${image.base64}`,
          },
        };
      }
      break;
    }
    case "Write": {
      const lines = text(input.content).replace(/\n$/, "").split("\n");
      display = {
        ...base,
        icon: "write",
        verb: "Write",
        runningVerb: "Writing",
        target: path,
        newFile: data?.type === "create",
        diff: { added: lines.length },
        detail: {
          kind: "diff",
          lines: lines.slice(0, WRITE_PREVIEW_LINES).map((code, index) => ({
            n: index + 1,
            sign: "+",
            code,
          })),
        },
      };
      break;
    }
    case "NotebookEdit":
      display = notebookEdit(base, input, data, path);
      break;
    case "Edit":
    case "MultiEdit": {
      const rows = patchRows((data?.structuredPatch as PatchHunk[] | undefined) ?? []);
      const edits = Array.isArray(input.edits) ? input.edits.length : 0;
      display = {
        ...base,
        icon: "edit",
        verb: "Edit",
        runningVerb: "Editing",
        target: path,
        tag: edits > 1 ? plural(edits, "edit") : undefined,
        diff: rows.length ? countRows(rows) : undefined,
        detail: rows.length ? { kind: "diff", lines: rows } : undefined,
      };
      break;
    }
    case "Bash": {
      const command = text(input.command);
      const description = text(input.description);
      const exit = result?.text.match(/^Exit code (\d+)/);
      const stdout = text(data?.stdout);
      const output = stdout + (data?.stderr ? `\n${text(data.stderr)}` : "");
      const ms = durationOf(call);
      const took = ms !== null && ms >= INSTANT_MS && result ? formatDuration(ms) : undefined;
      const commit = /\bgit\s+commit\b/.test(command) ? stdout.match(COMMIT_LINE) : null;
      const pr = /\bgh\s+pr\s+create\b/.test(command) ? output.match(PR_URL) : null;
      display = {
        ...base,
        icon: "bash",
        verb: input.run_in_background ? "Started" : "Run",
        runningVerb: "Running",
        target: description || command,
        prose: Boolean(description),
        note: description
          ? { text: firstLine(shortPaths(command, cwd), 200), mono: true }
          : undefined,
        command,
        meta: input.run_in_background
          ? "background"
          : exit
            ? [`exit ${exit[1]}`, took].filter(Boolean).join(" · ")
            : !failed && result
              ? took
                ? `✓ ${took}`
                : "✓"
              : took,
        metaTone: exit || failed ? "red" : result ? "green" : undefined,
        detail: outputDetail((output || result?.text || "").replace(EXIT_LINE, ""), failed),
        openByDefault: failed,
      };
      const exitFailed = failed || Boolean(exit && exit[1] !== "0");
      const failure = (output || result?.text || "").replace(EXIT_LINE, "");
      if (/\bgit\s+commit\b/.test(command) && exitFailed && COMMIT_HOOK.test(failure)) {
        const message = hookMessage(failure);
        display = {
          ...display,
          icon: "commit",
          tone: "red",
          verb: "Hook blocked commit",
          target: hookName(failure),
          prose: true,
          note: message ? { text: message } : undefined,
          openByDefault: false,
        };
        return display;
      }
      if (commit && !failed) {
        display = {
          ...display,
          icon: "commit",
          verb: "Commit",
          target: commit[3],
          prose: true,
          tag: commit[2].slice(0, 7),
          meta: stdout.match(FILES_CHANGED)?.[0].replace(" changed", ""),
          metaTone: undefined,
          note: undefined,
          detail: undefined,
        };
      }
      if (pr && !failed) {
        display = {
          ...display,
          pullRequest: {
            title: commandArgument(command, PR_TITLE) || description || "Pull request",
            number: Number(pr[1]),
            url: pr[0],
            branch: command.match(PR_HEAD)?.[1] ?? command.match(NEW_BRANCH)?.[1],
            base: command.match(PR_BASE)?.[1],
          },
        };
      }
      break;
    }
    case "Grep": {
      const files = Number(data?.numFiles ?? 0);
      const matches = Number(data?.numLines ?? data?.numMatches ?? 0);
      display = {
        ...base,
        icon: "search",
        verb: "Search",
        runningVerb: "Searching",
        target: text(input.pattern),
        aside: input.path ? `in ${relativePath(text(input.path), cwd)}` : undefined,
        meta: result
          ? files || matches
            ? [matches && plural(matches, "match"), files && plural(files, "file")]
                .filter(Boolean)
                .join(" · ")
            : "no matches"
          : undefined,
        detail: grepDetail(data, text(input.pattern), cwd),
      };
      break;
    }
    case "Glob": {
      const files = Number(data?.numFiles ?? 0);
      display = {
        ...base,
        icon: "find",
        verb: "Find",
        runningVerb: "Finding",
        target: text(input.pattern),
        meta: result ? (files ? plural(files, "file") : "no files") : undefined,
        detail: filesDetail(data?.filenames, cwd),
      };
      break;
    }
    case "WebFetch": {
      const domain = hostname(text(input.url));
      const ms = durationOf(call);
      display = {
        ...base,
        icon: "web",
        lead: result ? domain.charAt(0).toUpperCase() : undefined,
        verb: "Fetch",
        runningVerb: "Fetching",
        target: domain,
        aside: undefined,
        meta:
          [
            Number(data?.code) >= 400 && `${data?.code} ${text(data?.codeText)}`.trim(),
            ms !== null && result && formatDuration(ms),
          ]
            .filter(Boolean)
            .join(" · ") || undefined,
        metaTone: Number(data?.code) >= 400 ? "red" : undefined,
      };
      break;
    }
    case "WebSearch": {
      const detail = webResults(data);
      display = {
        ...base,
        icon: "web",
        verb: "Search the web",
        runningVerb: "Searching the web",
        target: text(input.query),
        prose: true,
        meta:
          detail?.kind === "web" ? plural(detail.results.length, "result") : result && "no results",
        detail,
      };
      break;
    }
    case "Task":
    case "Agent": {
      const summary =
        result && data?.status !== "async_launched" ? firstLine(result.text, 120) : "";
      const tools = Number(data?.totalToolUseCount ?? 0);
      const ms = durationOf(call);
      display = {
        ...base,
        icon: "agent",
        verb: text(input.subagent_type) || "Agent",
        runningVerb: text(input.subagent_type) || "Agent",
        target: text(input.description),
        prose: true,
        meta:
          data?.status === "async_launched"
            ? call.backgroundStatus
              ? `${call.backgroundStatus} in background`
              : "in background"
            : [tools && plural(tools, "tool"), ms !== null && result && formatDuration(ms)]
                .filter(Boolean)
                .join(" · ") || undefined,
        detail: summary ? { kind: "note", text: summary } : undefined,
        openByDefault: Boolean(summary),
      };
      break;
    }
    case "EnterPlanMode":
      display = {
        ...base,
        icon: "plan",
        verb: "Entered plan mode",
        runningVerb: "Entering plan mode",
        target: "",
        muted: true,
      };
      break;
    case "ToolSearch": {
      const query = text(input.query).replace(/^select:/, "");
      display = {
        ...base,
        icon: "tool",
        verb: "Loaded tools",
        runningVerb: "Loading tools",
        target: query.split(",").join(", "),
        prose: true,
        muted: true,
      };
      break;
    }
    case "Skill":
      display = {
        ...base,
        icon: "skill",
        tone: "accent",
        verb: "Using skill",
        runningVerb: "Using skill",
        target: text(input.skill),
        prose: true,
      };
      break;
    case "AskUserQuestion": {
      const questions = Array.isArray(input.questions) ? input.questions : [];
      const answers = Object.values((data?.answers ?? {}) as Record<string, unknown>)
        .map(text)
        .filter(Boolean);
      const reply = text(data?.response);
      display = {
        ...base,
        icon: "question",
        verb: "Asked",
        runningVerb: "Asking",
        target: text((questions[0] as { question?: string } | undefined)?.question),
        prose: true,
        note:
          answers.length || reply
            ? { text: `→ ${[...answers, reply].filter(Boolean).join(" · ")}` }
            : undefined,
      };
      break;
    }
    case "ExitPlanMode": {
      const plan = text(input.plan);
      display = {
        ...base,
        icon: "plan",
        verb: "Plan",
        runningVerb: "Planning",
        target: planTitle(plan),
        prose: true,
        meta: result ? (failed ? "kept planning" : "approved") : undefined,
        metaTone: result && !failed ? "green" : undefined,
      };
      if (failed) return display;
      break;
    }
    default:
      if (name.startsWith("mcp__")) {
        const { server, tool } = mcpName(name);
        display = {
          ...base,
          icon: "plug",
          lead: server.charAt(0).toUpperCase() || undefined,
          verb: server,
          runningVerb: server,
          target: tool,
        };
      } else {
        display = {
          ...base,
          target: firstLine(Object.values(input).map(text).find(Boolean) ?? ""),
        };
      }
  }

  if (failed && DENIED.test(result?.text ?? "")) {
    return {
      ...display,
      icon: "denied",
      tone: "muted",
      muted: true,
      verb: "Denied",
      lead: undefined,
      meta: "by you",
      metaTone: "muted",
      note: undefined,
      detail: undefined,
      openByDefault: false,
    };
  }
  if (failed && name !== "Bash") {
    return {
      ...display,
      icon: "error",
      tone: "red",
      meta: firstLine(result?.text ?? "", 48),
      metaTone: "red",
      detail: undefined,
      openByDefault: false,
    };
  }
  if (failed) return { ...display, tone: "red" };
  return display;
}

export function planTitle(plan: string): string {
  const heading = plan.match(/^#{1,3}\s+(.+)$/m)?.[1];
  return firstLine(heading ?? plan, 90)
    .replace(/[*_`]/g, "")
    .replace(/^plan:\s*/i, "");
}

export interface PermissionPrompt {
  title: string;
  subject: string;
  alwaysLabel: string;
}

export function permissionPrompt(
  tool: string,
  input: Record<string, unknown>,
  cwd: string,
): PermissionPrompt {
  if (tool === "Bash") {
    const command = text(input.command);
    const program = command.trim().split(/\s+/)[0] ?? "";
    return {
      title: "Claude wants to run a command",
      subject: command,
      alwaysLabel: program ? `Always allow ${program}` : "Always allow",
    };
  }
  if (["Edit", "MultiEdit", "Write", "NotebookEdit"].includes(tool)) {
    return {
      title: "Claude wants to edit a file",
      subject: relativePath(text(input.file_path) || text(input.notebook_path), cwd),
      alwaysLabel: "Always allow edits",
    };
  }
  if (tool === "WebFetch") {
    const domain = hostname(text(input.url));
    return {
      title: "Claude wants to open a page",
      subject: text(input.url),
      alwaysLabel: `Always allow ${domain}`,
    };
  }
  if (tool.startsWith("mcp__")) {
    const { server, tool: name } = mcpName(tool);
    return {
      title: `Claude wants to use ${server}`,
      subject: name,
      alwaysLabel: `Always allow ${server}`,
    };
  }
  return {
    title: `Claude wants to use ${tool}`,
    subject: firstLine(Object.values(input).map(text).find(Boolean) ?? tool, 120),
    alwaysLabel: `Always allow ${tool}`,
  };
}
