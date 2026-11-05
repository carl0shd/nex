import type { PermissionRequest } from "@native/agents/permissions";
import { formatDuration } from "@/lib/usage";
import { permissionPrompt, planTitle } from "@/lib/tool-display";

export interface ToastTask {
  title: string;
  project: string;
  branch: string;
  worktreePath: string;
}

export interface NeedsYouCopy {
  meta: string;
  title: string;
  body: string;
  code?: string;
  answerable: boolean;
}

const LINE_MAX = 140;

function oneLine(value: string): string {
  const line = value.trim().split("\n")[0] ?? "";
  return line.length > LINE_MAX ? `${line.slice(0, LINE_MAX - 1)}…` : line;
}

function firstQuestion(input: Record<string, unknown>): string {
  const questions = Array.isArray(input.questions) ? input.questions : [];
  const first = questions[0] as { question?: unknown } | undefined;
  return typeof first?.question === "string" ? first.question : "";
}

export function needsYouCopy(request: PermissionRequest, task: ToastTask): NeedsYouCopy {
  const base = { meta: `${task.project} · ${task.branch}`, title: task.title };
  if (request.tool === "AskUserQuestion") {
    const question = firstQuestion(request.input);
    return {
      ...base,
      body: "Has a question",
      code: question ? oneLine(question) : undefined,
      answerable: false,
    };
  }
  if (request.tool === "ExitPlanMode") {
    const plan = typeof request.input.plan === "string" ? request.input.plan : "";
    return {
      ...base,
      body: "Has a plan ready",
      code: plan ? planTitle(plan) : undefined,
      answerable: false,
    };
  }
  const prompt = permissionPrompt(request.tool, request.input, task.worktreePath);
  return {
    ...base,
    body: prompt.title.replace(/^\S+ wants/, "Wants"),
    code: prompt.subject ? oneLine(prompt.subject) : undefined,
    answerable: true,
  };
}

export function doneMeta(task: ToastTask, durationMs: number | undefined): string {
  return durationMs ? `${task.project} · ${formatDuration(durationMs)}` : task.project;
}

export function changesSummary(files: readonly { added: number; removed: number }[]): string {
  if (files.length === 0) return "";
  const added = files.reduce((sum, file) => sum + file.added, 0);
  const removed = files.reduce((sum, file) => sum + file.removed, 0);
  const count = files.length === 1 ? "1 file changed" : `${files.length} files changed`;
  return `${count} · +${added} −${removed}`;
}

export function replySummary(result: unknown): string {
  return typeof result === "string" ? oneLine(result) : "";
}

export type Shipped = { kind: "pr"; url: string } | { kind: "push"; prUrl?: string };

const PR_CREATE = /\bgh\s+pr\s+create\b/;
const GIT_PUSH = /\bgit\s+push\b/;
const PR_URL = /https:\/\/github\.com\/\S+?\/pull\/\d+/;
const NEW_PR_URL = /https:\/\/github\.com\/\S+?\/pull\/new\/\S+/;

export function shipped(command: string, output: string): Shipped | null {
  if (PR_CREATE.test(command)) {
    const url = output.match(PR_URL)?.[0];
    return url ? { kind: "pr", url } : null;
  }
  if (GIT_PUSH.test(command)) {
    return { kind: "push", prUrl: output.match(NEW_PR_URL)?.[0] };
  }
  return null;
}

export function toolResultText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => (typeof part?.text === "string" ? (part.text as string) : ""))
    .join("\n");
}
