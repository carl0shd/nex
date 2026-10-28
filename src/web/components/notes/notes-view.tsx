import { useEffect, useRef, useState } from "react";
import { MoreHoriz, SendDiagonal } from "iconoir-react";
import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { NotesEditor } from "@/components/notes/notes-editor";
import { relativeTime } from "@/lib/relative-time";

const SAVE_DELAY = 800;
const CLOCK_TICK = 30_000;

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLOCK_TICK);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export function NotesView({
  defaultValue,
  savedAt,
  onSave,
  onSendToClaude,
}: {
  defaultValue: string;
  savedAt?: number;
  onSave?: (markdown: string) => void;
  onSendToClaude?: (markdown: string) => void;
}) {
  const now = useNow();
  const [lastSaved, setLastSaved] = useState(savedAt);
  const [saving, setSaving] = useState(false);
  const latest = useRef(defaultValue);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const change = (markdown: string) => {
    latest.current = markdown;
    setSaving(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSave?.(markdown);
      setSaving(false);
      setLastSaved(Date.now());
    }, SAVE_DELAY);
  };

  const status = saving
    ? "Saving…"
    : lastSaved
      ? `Saved · ${relativeTime(lastSaved, now)}`
      : "Saved automatically";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex h-[42px] shrink-0 items-center gap-2 pr-2.5 pl-4">
        <span className="text-xs text-ink-4">{status}</span>
        <span className="ml-auto flex items-center gap-0.5">
          <Button size="sm" className="mr-1" onClick={() => onSendToClaude?.(latest.current)}>
            <SendDiagonal width={12} height={12} strokeWidth={2} />
            Send to Claude
          </Button>
          <IconButton size="sm" aria-label="More">
            <MoreHoriz width={14} height={14} strokeWidth={2} />
          </IconButton>
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NotesEditor
          defaultValue={defaultValue}
          onChange={change}
          className="pt-[18px] pr-[26px] pb-6 pl-11"
        />
      </div>
    </div>
  );
}
