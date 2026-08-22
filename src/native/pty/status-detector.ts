import type { TerminalStatus } from '@native/db/types';
import type { AgentStatusMarkers } from '@native/agents/status-markers';

const EVAL_INTERVAL_MS = 1_000;
const MAX_BURST = 32_000;
const TRIM_AT = MAX_BURST * 2;

/* eslint-disable no-control-regex */
const CURSOR_COLUMN = /\x1b\[\d*[GC]/g;
const ANSI_SEQUENCE = /\x1b\][\s\S]*?(?:\x07|\x1b\\)|\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
/* eslint-enable no-control-regex */

// A TUI spaces words with cursor jumps rather than spaces, so deleting them
// welds the hint line into `esctointerrupt` and no marker can match it.
function stripAnsi(text: string): string {
  return text.replace(CURSOR_COLUMN, ' ').replace(ANSI_SEQUENCE, '');
}

function toGlobal(pattern: RegExp): RegExp {
  return pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
}

function toStateless(pattern: RegExp): RegExp {
  return pattern.global ? new RegExp(pattern.source, pattern.flags.replace('g', '')) : pattern;
}

function isLineBreak(char: string): boolean {
  return char === '\n' || char === '\r';
}

// Widened from the hit instead of matched as a line: a line-spanning pattern
// retries from every column, ~160x the cost over a burst this size.
function lastMarkedLine(pattern: RegExp, text: string): string | null {
  pattern.lastIndex = 0;
  let at = -1;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    at = match.index;
    if (match.index === pattern.lastIndex) pattern.lastIndex++;
  }
  if (at < 0) return null;

  let start = at;
  while (start > 0 && !isLineBreak(text[start - 1])) start--;
  let end = at;
  while (end < text.length && !isLineBreak(text[end])) end++;
  return text.slice(start, end);
}

export interface StatusDetectorHandle {
  push: (data: string) => void;
  stop: () => void;
}

// Status is sticky because silence carries no signal: a turn was observed
// holding the status line untouched for 89 seconds while it worked.
export function createStatusDetector(
  markers: AgentStatusMarkers,
  onStatus: (status: TerminalStatus) => void
): StatusDetectorHandle {
  const statusLinePattern = toGlobal(markers.statusLine);
  const runningPattern = toStateless(markers.running);
  const waitingPattern = toStateless(markers.waiting);

  let pending = '';
  let current: TerminalStatus = 'idle';
  let evalTimer: NodeJS.Timeout | null = null;
  let stopped = false;

  const apply = (status: TerminalStatus): void => {
    if (current === status) return;
    current = status;
    onStatus(status);
  };

  const evaluate = (): void => {
    evalTimer = null;
    if (stopped || !pending) return;
    const text = stripAnsi(pending);
    pending = '';

    if (waitingPattern.test(text)) {
      apply('waiting');
      return;
    }

    const line = lastMarkedLine(statusLinePattern, text);
    if (line === null) return;

    apply(runningPattern.test(line) ? 'running' : 'idle');
  };

  return {
    push(data: string): void {
      if (stopped) return;
      pending += data;
      if (pending.length > TRIM_AT) pending = pending.slice(-MAX_BURST);
      if (!evalTimer) evalTimer = setTimeout(evaluate, EVAL_INTERVAL_MS);
    },
    stop(): void {
      stopped = true;
      pending = '';
      if (evalTimer) clearTimeout(evalTimer);
      evalTimer = null;
    }
  };
}
