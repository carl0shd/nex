import { useHeldKeys, useHotkeyRecorder } from "@tanstack/react-hotkeys";
import { useEffect, useRef, useState } from "react";
import { KeyCaps } from "@/components/atoms/kbd";
import type { Shortcut } from "@/lib/app-shortcuts";
import { heldKeysLabel, hotkeyCaps } from "@/lib/shortcut";
import { cn } from "@/lib/utils";

function RecordingKeys({ problem }: { problem: string | null }) {
  const held = heldKeysLabel(useHeldKeys());
  return (
    <>
      <span className={problem ? "text-red" : "text-ink-4"}>{problem ?? "esc to cancel"}</span>
      {held ? (
        <KeyCaps
          keys={[held]}
          className="[&>kbd]:text-ink [&>kbd]:shadow-[inset_0_0_0_1px_var(--accent-ink)]"
        />
      ) : (
        <span className="flex h-[22px] items-center rounded-chip border border-dashed border-line-focus px-2 text-ink-3">
          Press keys
        </span>
      )}
    </>
  );
}

const CONFLICT_MS = 2500;

export function ShortcutRow({
  shortcut,
  conflict,
  onChange,
}: {
  shortcut: Shortcut;
  conflict?: (hotkey: string) => string | null;
  onChange: (hotkey: string) => void;
}) {
  const [problem, setProblem] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const recorder = useHotkeyRecorder({
    onRecord: (hotkey) => {
      const found = conflict?.(hotkey) ?? null;
      if (!found) {
        setProblem(null);
        onChange(hotkey);
        return;
      }
      setProblem(found);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setProblem(null), CONFLICT_MS);
      requestAnimationFrame(() => recorder.startRecording());
    },
  });
  const caps = hotkeyCaps(shortcut.hotkey);

  return (
    <button
      type="button"
      data-menu-row
      aria-pressed={recorder.isRecording}
      onClick={recorder.isRecording ? recorder.cancelRecording : recorder.startRecording}
      className={cn(
        "interactive relative flex h-[45px] w-full cursor-pointer items-center px-4 text-left text-sm text-ink select-none",
        recorder.isRecording && "bg-hover",
      )}
    >
      {shortcut.label}
      <span className="ml-auto flex items-center gap-1.5 text-2xs text-ink-4">
        {recorder.isRecording ? (
          <RecordingKeys problem={problem} />
        ) : (
          <>
            <KeyCaps keys={[caps.join("")]} />
            {shortcut.through && (
              <>
                to
                <KeyCaps keys={[[...caps.slice(0, -1), shortcut.through].join("")]} />
              </>
            )}
          </>
        )}
      </span>
    </button>
  );
}
