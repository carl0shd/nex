import { splitLinks } from "@/lib/link-preview";

export type MessagePart =
  | { kind: "text"; text: string }
  | { kind: "file"; path: string }
  | { kind: "link"; url: string };

export interface PastedText {
  content: string;
  lines: number;
}

export interface UserMessage {
  parts: MessagePart[];
  pasted: PastedText[];
  imageNames: (string | undefined)[];
}

export const PASTED_CARD_LINES = 20;

const PASTED_FENCE = /^(`{3,})\n([\s\S]*?)\n\1$/gm;
const IMAGE_MARKER = /^\[Image (\d+): (.+)\]$/;
const GENERIC_IMAGE_NAME = /^image\.(png|jpe?g|gif|webp|heic|tiff?)$/i;
const MENTION = /(^|\s)@([^\s@]+)/g;
const ATTACHED_PATH = /^@([/~].*)$/;
const TRAILING_PUNCTUATION = /[.,;:!?)\]'"]+$/;
const LOOKS_LIKE_PATH = /[/.]/;
const LONGEST_FENCE = /^`{3,}/gm;

const lineCount = (text: string) => text.split("\n").length;

export function pastedBlock(content: string): string {
  const longest = Math.max(2, ...(content.match(LONGEST_FENCE) ?? []).map((run) => run.length));
  const fence = "`".repeat(longest + 1);
  return `${fence}\n${content}\n${fence}`;
}

export function imageMarker(position: number, name: string): string | null {
  return name && !GENERIC_IMAGE_NAME.test(name) ? `[Image ${position}: ${name}]` : null;
}

export function withoutImageMarkers(text: string): string {
  return takeImageMarkers(text).rest;
}

function takeImageMarkers(text: string): { rest: string; names: (string | undefined)[] } {
  const lines = text.split("\n");
  const names: (string | undefined)[] = [];
  while (lines.length) {
    const line = lines.at(-1)?.trim() ?? "";
    const marker = line.match(IMAGE_MARKER);
    if (!line && names.length) {
      lines.pop();
      continue;
    }
    if (!marker) break;
    names[Number(marker[1]) - 1] = marker[2];
    lines.pop();
  }
  return { rest: lines.join("\n").trimEnd(), names: Array.from(names) };
}

function mentionParts(text: string): MessagePart[] {
  const parts: MessagePart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(MENTION)) {
    const path = match[2].replace(TRAILING_PUNCTUATION, "");
    if (!LOOKS_LIKE_PATH.test(path)) continue;
    const start = match.index + match[1].length;
    if (start > cursor) parts.push({ kind: "text", text: text.slice(cursor, start) });
    parts.push({ kind: "file", path });
    cursor = start + 1 + path.length;
  }
  if (cursor < text.length) parts.push({ kind: "text", text: text.slice(cursor) });
  return parts;
}

function lineParts(line: string): MessagePart[] {
  const attached = line.trimEnd().match(ATTACHED_PATH);
  if (attached) return [{ kind: "file", path: attached[1] }];
  return splitLinks(line).flatMap((part) =>
    part.kind === "link" ? [part] : mentionParts(part.text),
  );
}

function merge(parts: MessagePart[]): MessagePart[] {
  const merged: MessagePart[] = [];
  for (const part of parts) {
    const previous = merged.at(-1);
    if (part.kind === "text" && previous?.kind === "text") previous.text += part.text;
    else merged.push(part.kind === "text" ? { ...part } : part);
  }
  return merged;
}

export function parseUserMessage(text: string): UserMessage {
  const { rest, names } = takeImageMarkers(text);
  const pasted: PastedText[] = [];
  const body = rest
    .replace(PASTED_FENCE, (block, _fence: string, content: string) => {
      if (lineCount(content) <= PASTED_CARD_LINES) return block;
      pasted.push({ content, lines: lineCount(content) });
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const parts = body
    ? merge(
        body
          .split("\n")
          .flatMap((line, index) => [
            ...(index > 0 ? [{ kind: "text" as const, text: "\n" }] : []),
            ...lineParts(line),
          ]),
      )
    : [];
  return { parts, pasted, imageNames: names };
}
