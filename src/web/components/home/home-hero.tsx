import { useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { NexLogo } from "@/components/atoms/nex-logo";
import { HomeBackdrop } from "@/components/home/home-backdrop";
import type { ScenePhase } from "@/lib/dither-scene";
import { cn } from "@/lib/utils";

const stagger = (index: number) => ({ animationDelay: `${index * 60}ms` }) as CSSProperties;

export function HomeHero({
  phase,
  greeting,
  backdrop = true,
  plain = false,
  ready = true,
  contentRef,
  footer,
  prompt,
  stats,
  className,
}: {
  phase: ScenePhase;
  greeting: string;
  backdrop?: boolean;
  plain?: boolean;
  ready?: boolean;
  contentRef?: RefObject<HTMLDivElement | null>;
  footer?: ReactNode;
  prompt?: ReactNode;
  stats?: ReactNode;
  className?: string;
}) {
  const ownContentRef = useRef<HTMLDivElement>(null);
  const focusRef = contentRef ?? ownContentRef;
  return (
    <div className={cn("relative flex flex-1 overflow-hidden", !plain && "dark", className)}>
      {backdrop && <HomeBackdrop phase={phase} focusRef={focusRef} />}
      <div
        ref={focusRef}
        className="relative flex flex-1 flex-col items-center justify-center px-8 pb-[12vh] text-center"
      >
        {ready && (
          <>
            <h1 className="rise-in m-0 flex items-center gap-3 text-3xl leading-9 font-semibold tracking-[-0.02em] text-ink">
              <NexLogo height={30} />
              {greeting}
            </h1>
            {prompt && (
              <div
                className="rise-in-glass relative z-10 mt-8 w-full max-w-[800px]"
                style={stagger(1)}
              >
                {prompt}
              </div>
            )}
            {stats && (
              <div className="rise-in-glass mt-8 w-full max-w-[800px]" style={stagger(2)}>
                {stats}
              </div>
            )}
          </>
        )}
        {footer && <div className="absolute bottom-6 left-1/2 -translate-x-1/2">{footer}</div>}
      </div>
    </div>
  );
}
