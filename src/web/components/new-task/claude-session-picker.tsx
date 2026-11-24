import type { ClaudeSessionInfo } from "@native/agents/claude-sessions";
import { Menu, MenuItem, MenuLabel } from "@/components/primitives/menu";
import { useNow } from "@/hooks/use-now";
import { relativeTime } from "@/lib/relative-time";

export function ClaudeSessionPicker({
  sessions,
  value,
  onChange,
}: {
  sessions: readonly ClaudeSessionInfo[];
  value: string | null;
  onChange: (session: ClaudeSessionInfo | null) => void;
}) {
  const now = useNow(60_000);
  return (
    <Menu width={320} maxHeight={340}>
      <MenuItem checked={value === null} onSelect={() => onChange(null)}>
        New conversation
      </MenuItem>
      <MenuLabel>Continue from Claude Code</MenuLabel>
      {sessions.map((session) => (
        <MenuItem
          key={session.id}
          checked={session.id === value}
          meta={relativeTime(session.updatedAt, now)}
          onSelect={() => onChange(session)}
        >
          <span title={session.title} className="truncate">
            {session.title}
          </span>
        </MenuItem>
      ))}
    </Menu>
  );
}
