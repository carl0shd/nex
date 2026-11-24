import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { DitherScene } from "@/components/atoms/dither-scene";
import { useAppBackdrop } from "@/components/layout/app-backdrop";
import { ChromeGlass } from "@/components/layout/chrome-glass";
import type { ScenePhase } from "@/lib/dither-scene";

export function HomeBackdrop({
  phase,
  focusRef,
  fullWindow = false,
}: {
  phase: ScenePhase;
  focusRef?: RefObject<HTMLElement | null>;
  fullWindow?: boolean;
}) {
  const backdrop = useAppBackdrop();
  const scene = <DitherScene phase={phase} focusRef={focusRef} />;
  if (!fullWindow || !backdrop) return scene;
  return createPortal(
    <>
      {scene}
      <ChromeGlass />
    </>,
    backdrop,
  );
}
