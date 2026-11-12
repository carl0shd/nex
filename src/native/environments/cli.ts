import { spawn } from "child_process";
import { friendlyError } from "./parse";

export type EnvLog = (line: string) => void;

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface RunOptions {
  log?: EnvLog;
  timeoutMs?: number;
  onLine?: (line: string) => void;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 30_000;

function splitLines(onLine: (line: string) => void) {
  let rest = "";
  return {
    push(chunk: string) {
      const lines = (rest + chunk).split(/\r?\n|\r/);
      rest = lines.pop() ?? "";
      for (const line of lines) if (line.trim()) onLine(line);
    },
    flush() {
      if (rest.trim()) onLine(rest);
      rest = "";
    },
  };
}

export function run(command: string, args: readonly string[], options: RunOptions = {}) {
  const { log, onLine, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  log?.(`$ ${[command, ...args].join(" ")}`);
  return new Promise<RunResult>((resolve) => {
    let stdout = "";
    let stderr = "";
    const emit = (line: string) => {
      log?.(line);
      onLine?.(line);
    };
    const outLines = splitLines(emit);
    const errLines = splitLines(emit);
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    options.signal?.addEventListener("abort", () => child.kill("SIGTERM"), { once: true });
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
      stdout += chunk;
      outLines.push(chunk);
    });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
      stderr += chunk;
      errLines.push(chunk);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      log?.(error.message);
      resolve({ code: -1, stdout, stderr: stderr || error.message });
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      outLines.flush();
      errLines.flush();
      const timedOut = signal === "SIGTERM" && code === null;
      if (timedOut) log?.(`Timed out after ${Math.round(timeoutMs / 1000)}s`);
      resolve({
        code: code ?? -1,
        stdout,
        stderr: timedOut ? `${stderr}\nTimed out after ${Math.round(timeoutMs / 1000)}s` : stderr,
      });
    });
  });
}

export async function runOk(command: string, args: readonly string[], options: RunOptions = {}) {
  const result = await run(command, args, options);
  if (result.code !== 0) throw new Error(friendlyError(result.stderr || result.stdout));
  return result.stdout;
}
