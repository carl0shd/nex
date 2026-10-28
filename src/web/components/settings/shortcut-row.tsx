import { useEffect, useState } from "react";
import { KeyCaps } from "@/components/atoms/kbd";
import { shortcutKeys } from "@/lib/shortcut";
import { cn } from "@/lib/utils";

export interface Shortcut {
  id: string;
  label: string;
  keys: readonly string[];
  through?: string;
}

export function ShortcutRow({
  shortcut,
  onChange,
}: {
  shortcut: Shortcut;
  onChange: (keys: string[]) => void;
}) {
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!recording) return;
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      if (event.key === "Escape") return setRecording(false);
      const keys = shortcutKeys(event);
      if (!keys) return;
      onChange(keys);
      setRecording(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [recording, onChange]);

  return (
    <button
      type="button"
      data-menu-row
      aria-pressed={recording}
      onClick={() => setRecording((value) => !value)}
      className={cn(
        "interactive relative flex h-[45px] w-full cursor-pointer items-center px-4 text-left text-sm text-ink select-none",
        recording && "bg-hover",
      )}
    >
      {shortcut.label}
      <span className="ml-auto flex items-center gap-1.5 text-2xs text-ink-4">
        {recording ? (
          <span className="text-accent-ink">Press the new shortcut · esc to cancel</span>
        ) : (
          <>
            <KeyCaps keys={[...shortcut.keys]} />
            {shortcut.through && (
              <>
                to
                <KeyCaps keys={[shortcut.through]} />
              </>
            )}
          </>
        )}
      </span>
    </button>
  );
}
