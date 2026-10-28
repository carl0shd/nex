import type { CSSProperties } from "react";
import { Button } from "@/components/atoms/button";
import { Kbd } from "@/components/atoms/kbd";
import { NexLogoTile } from "@/components/atoms/nex-logo";

const SHORTCUTS = [
  { keys: "⌘K", label: "Jump to a project or file" },
  { keys: "⌘⇧N", label: "Add workspace" },
  { keys: "⌘,", label: "Settings" },
];

const stagger = (index: number) => ({ animationDelay: `${index * 50}ms` }) as CSSProperties;

export function HomeEmpty({ onNewTask }: { onNewTask?: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center pb-[72px] text-center">
      <NexLogoTile className="rise-in" />
      <h1
        className="rise-in m-0 mt-[22px] text-2xl leading-[30px] font-semibold tracking-[-0.02em] text-ink"
        style={stagger(1)}
      >
        Nothing running
      </h1>
      <p className="rise-in m-0 mt-2 max-w-[420px] text-base text-ink-3" style={stagger(2)}>
        Start a task and Claude works on it in its own worktree. Every agent you run shows up here.
      </p>
      <Button
        variant="primary"
        size="lg"
        kbd="⌘T"
        className="rise-in mt-6"
        style={stagger(3)}
        onClick={onNewTask}
      >
        New task
      </Button>
      <div
        className="rise-in mt-10 flex items-center gap-[22px] text-xs text-ink-4"
        style={stagger(4)}
      >
        {SHORTCUTS.map((shortcut) => (
          <span key={shortcut.keys} className="flex items-center gap-2">
            <Kbd>{shortcut.keys}</Kbd>
            {shortcut.label}
          </span>
        ))}
      </div>
    </div>
  );
}
