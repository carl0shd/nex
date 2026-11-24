const TITLE_MAX = 80;

interface Entry {
  type?: unknown;
  isMeta?: unknown;
  isSidechain?: unknown;
  message?: { content?: unknown };
}

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const block = content.find(
    (item: { type?: unknown; text?: unknown }) =>
      item?.type === "text" && typeof item.text === "string",
  ) as { text: string } | undefined;
  return block?.text ?? "";
}

export function claudeSessionTitle(lines: readonly string[]): string | null {
  for (const line of lines) {
    let entry: Entry;
    try {
      entry = JSON.parse(line) as Entry;
    } catch {
      continue;
    }
    if (entry.type !== "user" || entry.isMeta || entry.isSidechain) continue;
    const text = textOf(entry.message?.content).trim();
    if (!text || text.startsWith("<")) continue;
    const first = text.split("\n")[0]?.trim() ?? "";
    return first.length > TITLE_MAX ? `${first.slice(0, TITLE_MAX - 1)}…` : first;
  }
  return null;
}
