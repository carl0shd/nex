import { useHotkey } from "@tanstack/react-hotkeys";
import { useRef, type ReactNode, type RefObject } from "react";
import { Button } from "@/components/atoms/button";
import { DitherBackdrop } from "@/components/atoms/dither-backdrop";
import { NexLogo, NexWordmark } from "@/components/atoms/nex-logo";
import { cn } from "@/lib/utils";

const WORDMARK_HEIGHT = 56;

export function WelcomeScreen({
  preview,
  logoRef: outerLogoRef,
  onStart,
}: {
  preview?: ReactNode;
  logoRef?: RefObject<HTMLDivElement | null>;
  onStart?: () => void;
}) {
  useHotkey("Enter", () => onStart?.());
  const ownLogoRef = useRef<HTMLDivElement>(null);
  const logoRef = outerLogoRef ?? ownLogoRef;

  return (
    <main
      className={cn(
        "relative flex min-h-0 flex-1 flex-col items-center overflow-hidden text-center",
        preview ? "pt-16" : "justify-center pb-4",
      )}
    >
      {!preview && !outerLogoRef && <DitherBackdrop anchorRef={logoRef} className="fixed" />}
      <div ref={logoRef} className="relative flex justify-center">
        <NexLogo
          height={WORDMARK_HEIGHT}
          className="rise-in absolute top-3 left-0 opacity-25 blur-[18px] [animation-delay:200ms]"
        />
        <NexWordmark height={WORDMARK_HEIGHT} className="rise-in relative" />
      </div>
      <p className="rise-in relative m-0 mt-7 max-w-[500px] text-md leading-[23px] text-ink-3 [animation-delay:120ms]">
        Run several coding agents at once, without them stepping on each other.
      </p>
      <Button
        variant="primary"
        size="lg"
        kbd="↵"
        onClick={onStart}
        className="rise-in relative mt-[26px] [animation-delay:180ms]"
      >
        Get started
      </Button>
      <span className="rise-in relative mt-3.5 text-xs text-ink-4 [animation-delay:220ms]">
        About a minute · uses your existing agent subscription
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
