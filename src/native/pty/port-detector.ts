import { stripAnsi } from "@native/pty/status-detector";

const LOCAL_HOST = String.raw`(?:(?:[\w-]+\.)*localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\])`;
const LOCAL_URL = new RegExp(String.raw`\b(?:https?|wss?|tcp)://${LOCAL_HOST}:(\d{2,5})\b`, "i");
const LISTENING = new RegExp(
  String.raw`\b(?:listening|running|started|serving|server|ready|bound)\b.{0,40}?(?:\bport\s*[:=]?\s*|\b(?:on|at)\s+(?:${LOCAL_HOST}|::1?)?:)(\d{2,5})\b`,
  "i",
);
const NOT_LISTENING = /\b(?:in use|eaddrinuse|already|proxy|failed|error|refused|unable)\b/i;
const MAX_LINE = 4_000;

function validPort(text: string | undefined): number | null {
  const port = Number(text);
  return Number.isInteger(port) && port > 0 && port <= 65_535 ? port : null;
}

export function findPort(line: string): number | null {
  if (NOT_LISTENING.test(line)) return null;
  return validPort((line.match(LOCAL_URL) ?? line.match(LISTENING))?.[1]);
}

export interface PortDetectorHandle {
  push: (data: string) => void;
}

export function createPortDetector(onPort: (port: number) => void): PortDetectorHandle {
  let partial = "";
  let current: number | null = null;
  return {
    push(data) {
      const lines = (partial + data).split(/[\r\n]+/);
      partial = (lines.pop() ?? "").slice(-MAX_LINE);
      for (const line of lines) {
        const port = findPort(stripAnsi(line));
        if (port === null || port === current) continue;
        current = port;
        onPort(port);
      }
    },
  };
}
