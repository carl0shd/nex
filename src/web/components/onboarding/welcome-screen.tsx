import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/atoms/button";
import { NexLogoTile } from "@/components/atoms/nex-logo";

export function WelcomeScreen({ preview, onStart }: { preview?: ReactNode; onStart?: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.defaultPrevented || target.closest("input, textarea, [contenteditable]")) return;
      if (event.key === "Enter") onStart?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onStart]);

  return (
    <main className="relative flex min-h-0 flex-1 flex-col items-center overflow-hidden pt-16 text-center">
      <NexLogoTile className="rise-in" />
      <h1 className="rise-in m-0 mt-[22px] text-3xl font-semibold tracking-[-0.03em] text-ink [animation-delay:60ms]">
        Welcome to Nex
      </h1>
      <p className="rise-in m-0 mt-2.5 max-w-[500px] text-md leading-[23px] text-ink-3 [animation-delay:120ms]">
        Run Claude Code on many tasks at once, each in its own worktree, and watch them all work
        from one place.
      </p>
      <Button
        variant="primary"
        size="lg"
        kbd="↵"
        onClick={onStart}
        className="rise-in mt-[26px] [animation-delay:180ms]"
      >
        Get started
      </Button>
      <span className="rise-in mt-3.5 text-xs text-ink-4 [animation-delay:220ms]">
        About a minute · uses your existing Claude subscription
      </span>
      {preview && (
        <div
          aria-hidden
          className="rise-in pointer-events-none mt-12 h-[475px] w-[760px] shrink-0 overflow-hidden rounded-panel bg-page shadow-[0_0_0_1px_var(--line-strong),0_30px_60px_-20px_rgb(0_0_0/70%)] [animation-delay:300ms]"
        >
          <div className="h-[900px] w-[1440px] origin-top-left scale-[0.5278]">{preview}</div>
        </div>
      )}
    </main>
  );
}
