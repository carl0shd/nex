import type { TerminalStatus } from '@native/db/types';
import type { AgentStatusMarkers } from '@native/agents/status-markers';

const EVAL_INTERVAL_MS = 250;
const RUNNING_EXPIRY_MS = 1_200;
const QUIET_CONFIRM_MS = 400;
const MAX_BURST = 32_000;

/* eslint-disable no-control-regex */
const OSC_SEQUENCE = /\x1b\][\s\S]*?(?:\x07|\x1b\\)/g;
const ESC_SEQUENCE = /\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
/* eslint-enable no-control-regex */

function stripAnsi(text: string): string {
  return text.replace(OSC_SEQUENCE, '').replace(ESC_SEQUENCE, '');
}

export interface StatusDetectorHandle {
  push: (data: string) => void;
  stop: () => void;
}

/**
 * Infers what an agent is doing from the output it paints, without emulating a
 * screen.
 *
 * Output is evaluated in bursts rather than as an append-only log, so a spinner
 * from two turns ago can't hold the terminal green. Idle is never asserted by a
 * marker of its own: a burst can straddle the end of a turn, carrying both the
 * last spinner frames and the frame that replaced them, and any within-burst
 * ordering rule reads one of those two cases backwards. So `running` instead
 * expires RUNNING_EXPIRY_MS after the last frame that claimed it — a working
 * agent ticks its spinner, and one that stopped simply stops saying so.
 *
 * `waiting` is the exception that must survive silence: a permission prompt is
 * painted once and then nothing happens until the user answers. It is held
 * until some other frame arrives, and a frame with no marker at all only
 * releases it after QUIET_CONFIRM_MS.
 */
export function createStatusDetector(
  markers: AgentStatusMarkers,
  onStatus: (status: TerminalStatus) => void
): StatusDetectorHandle {
  let pending = '';
  let current: TerminalStatus = 'idle';
  let evalTimer: NodeJS.Timeout | null = null;
  let expiryTimer: NodeJS.Timeout | null = null;
  let quietTimer: NodeJS.Timeout | null = null;
  let stopped = false;

  const cancelExpiry = (): void => {
    if (!expiryTimer) return;
    clearTimeout(expiryTimer);
    expiryTimer = null;
  };

  const cancelQuiet = (): void => {
    if (!quietTimer) return;
    clearTimeout(quietTimer);
    quietTimer = null;
  };

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

    if (markers.waiting.test(text)) {
      cancelQuiet();
      cancelExpiry();
      apply('waiting');
      return;
    }

    if (markers.running.test(text)) {
      cancelQuiet();
      cancelExpiry();
      apply('running');
      expiryTimer = setTimeout(() => {
        expiryTimer = null;
        apply('idle');
      }, RUNNING_EXPIRY_MS);
      return;
    }

    if (current !== 'waiting' || quietTimer) return;
    quietTimer = setTimeout(() => {
      quietTimer = null;
      apply('idle');
    }, QUIET_CONFIRM_MS);
  };

  return {
    push(data: string): void {
      if (stopped) return;
      pending += data;
      if (pending.length > MAX_BURST) pending = pending.slice(-MAX_BURST);
      if (!evalTimer) evalTimer = setTimeout(evaluate, EVAL_INTERVAL_MS);
    },
    stop(): void {
      stopped = true;
      pending = '';
      if (evalTimer) clearTimeout(evalTimer);
      evalTimer = null;
      cancelExpiry();
      cancelQuiet();
    }
  };
}
