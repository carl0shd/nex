export type ContextPart = "conversation" | "tools" | "system" | "extras";

export interface ContextUsage {
  used: number;
  max: number;
  percent: number;
  parts: { id: ContextPart; tokens: number }[];
}

interface RawCategory {
  name?: string;
  tokens?: number;
  kind?: string;
  isDeferred?: boolean;
}

const PART_OF: Record<string, ContextPart> = {
  Messages: "conversation",
  "System tools": "tools",
  "MCP tools": "tools",
  "System prompt": "system",
  "Memory files": "system",
};

const ORDER: ContextPart[] = ["conversation", "tools", "system", "extras"];

export function toContextUsage(raw: unknown): ContextUsage | null {
  const data = raw as {
    categories?: RawCategory[];
    totalTokens?: number;
    maxTokens?: number;
  } | null;
  if (!data || !Array.isArray(data.categories) || !data.maxTokens) return null;
  const totals = new Map<ContextPart, number>();
  for (const category of data.categories) {
    if (category.kind !== "used" || category.isDeferred || !category.tokens) continue;
    const part = PART_OF[category.name ?? ""] ?? "extras";
    totals.set(part, (totals.get(part) ?? 0) + category.tokens);
  }
  const used = data.totalTokens ?? [...totals.values()].reduce((sum, tokens) => sum + tokens, 0);
  return {
    used,
    max: data.maxTokens,
    percent: Math.min(100, Math.round((used / data.maxTokens) * 100)),
    parts: ORDER.filter((id) => totals.get(id)).map((id) => ({ id, tokens: totals.get(id) ?? 0 })),
  };
}
