import { useRef, useState } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Plug } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { TextField } from "@/components/atoms/text-field";
import { ModalCard, StatusIcon } from "@/components/primitives/modal-card";
import { ipcErrorMessage } from "@/lib/ipc-error";

export interface NewServer {
  name: string;
  target: string;
}

export function AddServerDialog({
  onAdd,
  onCancel,
}: {
  onAdd: (server: NewServer) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const ready = Boolean(name.trim() && target.trim()) && !adding;
  useHotkey("Escape", onCancel, { target: formRef, enabled: !adding });

  const submit = async () => {
    if (!ready) return;
    setAdding(true);
    setError(null);
    try {
      await onAdd({ name: name.trim(), target: target.trim() });
    } catch (failure) {
      setError(ipcErrorMessage(failure));
      setAdding(false);
    }
  };

  return (
    <form
      ref={formRef}
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <ModalCard
        title="Add a server"
        description="Claude Code starts it for this project. It’s saved in the project’s .mcp.json, so it travels with the branch."
        icon={<StatusIcon tone="green" icon={Plug} />}
        onClose={onCancel}
        footer={
          <>
            {error && (
              <span className="min-w-0 flex-1 truncate text-xs text-red" title={error}>
                {error}
              </span>
            )}
            <span className="ml-auto" />
            <Button type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!ready}>
              {adding ? "Adding…" : "Add server"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TextField
            label="Name"
            autoFocus
            value={name}
            placeholder="sentry"
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="Command or URL"
            value={target}
            placeholder="npx -y @sentry/mcp-server or https://mcp.sentry.dev/mcp"
            hint="A URL connects over HTTP. Anything else runs as a command."
            onChange={(event) => setTarget(event.target.value)}
          />
        </div>
      </ModalCard>
    </form>
  );
}
