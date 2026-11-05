import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/atoms/button";
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
  const [empty, setEmpty] = useState(!defaultValue.trim());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef(false);
  const saveRef = useRef(onSave);
  useEffect(() => {
    saveRef.current = onSave;
  });
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (pending.current) saveRef.current?.(latest.current);
    },
    [],
  );

  const change = (markdown: string) => {
    latest.current = markdown;
    setEmpty(!markdown.trim());
    setSaving(true);
    pending.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pending.current = false;
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
          {onSendToClaude && (
            <Button size="sm" disabled={empty} onClick={() => onSendToClaude(latest.current)}>
              <Send width={12} height={12} strokeWidth={2} />
              Send to Claude
            </Button>
          )}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NotesEditor
          defaultValue={defaultValue}
          onChange={change}
          contentClassName="pt-[18px] pr-[26px] pb-6 pl-11"
        />
      </div>
    </div>
  );
}
