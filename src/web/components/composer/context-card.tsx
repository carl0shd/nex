import type { ContextPart, ContextUsage } from "@native/agents/context-usage";
import { compactTokens } from "@/lib/usage";
import { cn } from "@/lib/utils";

const PARTS: Record<ContextPart, { label: string; color: string }> = {
  conversation: { label: "Conversation", color: "bg-accent" },
  tools: { label: "Tools", color: "bg-blue" },
  system: { label: "System and CLAUDE.md", color: "bg-orange" },
  extras: { label: "Skills and agents", color: "bg-ink-4" },
};

export function ContextCard({
  usage,
  compactAt = 95,
  onCompact,
}: {
  usage: ContextUsage;
  compactAt?: number;
  onCompact?: () => void;
}) {
  const free = Math.max(0, usage.max - usage.used);
  return (
    <div className="enter-pop flex w-[280px] flex-col gap-2.5 rounded-panel bg-elevated p-3.5 shadow-overlay">
      <div className="flex items-center">
        <span className="text-sm font-medium text-ink">Context</span>
        <span className="ml-auto text-xs text-ink-3 tabular-nums">
          {compactTokens(usage.used)} of {compactTokens(usage.max)}
        </span>
      </div>
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        {usage.parts.map((part) => (
          <span key={part.id} className={PARTS[part.id].color} style={{ flex: part.tokens }} />
        ))}
        <span className="bg-hover-2" style={{ flex: free }} />
      </div>
      {usage.parts.map((part) => (
        <div key={part.id} className="flex items-center gap-2 text-xs text-ink-2">
          <span className={cn("size-2 rounded-[2px]", PARTS[part.id].color)} />
          {PARTS[part.id].label}
          <span className="ml-auto text-ink-4 tabular-nums">{compactTokens(part.tokens)}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 border-t border-line-soft pt-2.5">
        <span className="text-2xs whitespace-nowrap text-ink-4">Auto-compacts at {compactAt}%</span>
        {onCompact && (
          <button
            type="button"
            onClick={onCompact}
            className="interactive press ml-auto h-6 shrink-0 cursor-pointer rounded-full bg-control-off px-2.5 text-2xs font-medium whitespace-nowrap text-ink shadow-[0_0_0_1px_var(--line-chip)] select-none hover:bg-hover-2"
          >
            Compact now
          </button>
        )}
      </div>
    </div>
  );
}
