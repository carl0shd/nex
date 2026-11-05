import { useEffect, useState } from "react";
import { NotesView } from "@/components/notes/notes-view";

const latestNotes = new Map<string, string>();

export function AppTaskNotes({
  sessionId,
  onSendToClaude,
}: {
  sessionId: string;
  onSendToClaude?: (markdown: string) => void;
}) {
  const [notes, setNotes] = useState<string | null>(() => latestNotes.get(sessionId) ?? null);

  useEffect(() => {
    if (latestNotes.has(sessionId)) return;
    let cancelled = false;
    void window.api.readSessionNotes(sessionId).then((text) => !cancelled && setNotes(text));
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (notes === null) return null;
  return (
    <NotesView
      defaultValue={notes}
      onSave={(markdown) => {
        latestNotes.set(sessionId, markdown);
        void window.api.writeSessionNotes(sessionId, markdown);
      }}
      onSendToClaude={onSendToClaude}
    />
  );
}
