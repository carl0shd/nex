import { Hexagon, Sparks, Terminal } from "iconoir-react";
import { ClaudeTile } from "@/components/atoms/agent-tile";
import { cn } from "@/lib/utils";

export type AgentKind = "claude" | "codex" | "gemini" | "shell";

const TILE = {
  codex: {
    icon: Hexagon,
    className: "bg-inverse text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]",
  },
  gemini: { icon: Sparks, className: "bg-blue-tint text-blue" },
  shell: { icon: Terminal, className: "bg-elevated text-ink-2" },
} as const;

export function AgentLogo({ agent, size = 26 }: { agent: AgentKind; size?: 16 | 26 }) {
  if (agent === "claude") return <ClaudeTile size={size} />;
  const { icon: Icon, className } = TILE[agent];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        size === 26 ? "size-[26px] rounded-[7px]" : "size-4 rounded-[4px]",
        className,
      )}
    >
      <Icon width={size === 26 ? 14 : 10} height={size === 26 ? 14 : 10} strokeWidth={2} />
    </span>
  );
}
