import { useEffect, useRef, type RefObject } from "react";
import {
  packColor,
  renderScene,
  SCENE_LEVELS,
  sceneBuffers,
  type ScenePhase,
} from "@/lib/dither-scene";
import { readCssToken } from "@/lib/terminal-theme";
import { cn } from "@/lib/utils";

const FRAME_MS = 1000 / 15;
const CELL_PX = 2;
const RESIZE_EVERY_MS = 120;

function readPalette(phase: ScenePhase): Uint32Array {
  const palette = new Uint32Array(SCENE_LEVELS);
  for (let level = 0; level < SCENE_LEVELS; level++) {
    palette[level] = packColor(readCssToken(`--scene-${phase}-${level}`));
  }
  return palette;
}

export function DitherScene({
  phase,
  focusRef,
  className,
}: {
  phase: ScenePhase;
  focusRef?: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = frameRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!box || !canvas || !context) return;
    let palette = readPalette(phase);
    let buffers = sceneBuffers(1, 1, phase);
    let image = context.createImageData(1, 1);
    let pixels = new Uint32Array(image.data.buffer);

    let focusX = 0.5;
    const focusOf = () => {
      const focus = focusRef?.current?.getBoundingClientRect();
      const bounds = box.getBoundingClientRect();
      if (!focus || bounds.width === 0) return 0.5;
      return Math.round(((focus.left + focus.width / 2 - bounds.left) / bounds.width) * 100) / 100;
    };

    const resize = () => {
      const width = Math.max(1, Math.ceil(box.clientWidth / CELL_PX));
      const height = Math.max(1, Math.ceil(box.clientHeight / CELL_PX));
      const focus = focusOf();
      if (width === buffers.width && height === buffers.height && focus === focusX) return;
      focusX = focus;
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width * CELL_PX}px`;
      canvas.style.height = `${height * CELL_PX}px`;
      buffers = sceneBuffers(width, height, phase, focusX);
      image = context.createImageData(width, height);
      pixels = new Uint32Array(image.data.buffer);
    };

    const draw = (time: number) => {
      renderScene(buffers, phase, time, palette, pixels);
      context.putImageData(image, 0, 0);
    };

    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("motion-reduce");
    let frame = 0;
    let visible = false;
    let last = 0;
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (time - last < FRAME_MS) return;
      last = time;
      draw(time);
    };
    const run = () => {
      cancelAnimationFrame(frame);
      resize();
      draw(still ? 0 : performance.now());
      if (!still && visible) frame = requestAnimationFrame(tick);
    };

    // Rebuilding takes a few frames, so a live resize rebuilds at most every 120ms; between rebuilds
    // the canvas keeps its pixel size and is cropped, never stretched.
    let settle = 0;
    let sizedAt = -Infinity;
    const rebuild = () => {
      sizedAt = performance.now();
      run();
    };
    const sizing = new ResizeObserver(() => {
      window.clearTimeout(settle);
      const wait = RESIZE_EVERY_MS - (performance.now() - sizedAt);
      if (wait <= 0) rebuild();
      else settle = window.setTimeout(rebuild, wait);
    });
    sizing.observe(box);
    if (focusRef?.current) sizing.observe(focusRef.current);
    const viewing = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      run();
    });
    viewing.observe(box);
    const theme = new MutationObserver(() => {
      palette = readPalette(phase);
      if (still || !visible) draw(0);
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      sizing.disconnect();
      viewing.disconnect();
      theme.disconnect();
    };
  }, [phase, focusRef]);

  return (
    <div
      ref={frameRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <canvas ref={canvasRef} className="dither-scene absolute top-0 left-0" />
    </div>
  );
}
