import { useEffect, useRef, type RefObject } from "react";
import { cn } from "@/lib/utils";

const CELL = 3;
const TILE = 12;
const OFFSETS = [
  [0, 0],
  [6, 6],
  [6, 0],
  [0, 6],
  [3, 3],
  [9, 9],
  [9, 3],
  [3, 9],
  [3, 0],
  [9, 6],
  [9, 0],
  [3, 6],
] as const;
const LAYERS = OFFSETS.length;
const SLOTS = TILE / CELL;
const LAYER_AT: number[] = Array.from({ length: SLOTS * SLOTS }, () => -1);
OFFSETS.forEach(([x, y], layer) => {
  LAYER_AT[(y / CELL) * SLOTS + x / CELL] = layer;
});

const RADIUS_X = 1200;
const RADIUS_Y = 750;
const FPS = 15;
const START_DELAY_MS = 300;
const STEP_MS = 160;
const STEPS_PER_RADIUS = 24;
const RESTING_REACH = 1.3;
const FADE_STEPS = 25;
const PAUSE_MS = 3000;
const CYCLE_STEPS =
  Math.ceil(RESTING_REACH * STEPS_PER_RADIUS) + FADE_STEPS + Math.round(PAUSE_MS / STEP_MS);

type Rgb = [number, number, number];

function tokenRgb(name: string): Rgb {
  const probe = document.createElement("span");
  probe.style.color = `var(--${name})`;
  document.body.append(probe);
  const [r, g, b] = getComputedStyle(probe).color.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
  probe.remove();
  return [r, g, b];
}

const rgba = ([r, g, b]: Rgb, alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

function palette() {
  const accent = tokenRgb("accent");
  const green = tokenRgb("green");
  return [rgba(accent, 0.13), rgba(accent, 0.18), rgba(green, 0.17)];
}

const tone = (layer: number) => (layer < 4 ? 0 : layer < 8 ? 1 : 2);

export function DitherBackdrop({
  anchorRef,
  fadeOut = false,
  className,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  fadeOut?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fadeOutRef = useRef(fadeOut);
  useEffect(() => {
    fadeOutRef.current = fadeOut;
  }, [fadeOut]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const colors = palette();
    const startedAt = performance.now();
    let frame = 0;
    let lastDraw = 0;
    let center: { x: number; y: number } | null = null;
    let fadeOutFrom: number | null = null;
    let done = false;

    const draw = (now: number) => {
      const box = canvas.getBoundingClientRect();
      const anchor = anchorRef.current?.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(box.width * ratio))
        canvas.width = Math.round(box.width * ratio);
      if (canvas.height !== Math.round(box.height * ratio))
        canvas.height = Math.round(box.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, box.width, box.height);

      if (anchor) {
        center = {
          x: anchor.left + anchor.width / 2 - box.left,
          y: anchor.top + anchor.height / 2 - box.top,
        };
      }
      const centerX = center?.x ?? box.width / 2;
      const centerY = center?.y ?? box.height / 2;
      const elapsedSteps = Math.floor((now - startedAt - START_DELAY_MS) / STEP_MS);
      if (fadeOutRef.current && fadeOutFrom === null) fadeOutFrom = elapsedSteps;
      const leaving =
        fadeOutFrom === null ? 1 : 1 - Math.min(1, (elapsedSteps - fadeOutFrom) / FADE_STEPS);
      if (leaving <= 0) {
        done = true;
        return;
      }
      const step = elapsedSteps < 0 ? 0 : (elapsedSteps % CYCLE_STEPS) + 1;
      const grown = reduced ? RESTING_REACH : step / STEPS_PER_RADIUS;
      const fadeStep = step - RESTING_REACH * STEPS_PER_RADIUS;
      const opacity = (reduced ? 1 : 1 - Math.min(1, Math.max(0, fadeStep) / FADE_STEPS)) * leaving;
      if (grown <= 0 || opacity <= 0) return;
      context.globalAlpha = opacity;

      const paths = colors.map(() => new Path2D());
      for (let y = 0; y < box.height; y += CELL) {
        const dy = (y + CELL / 2 - centerY) / RADIUS_Y;
        for (let x = 0; x < box.width; x += CELL) {
          const layer = LAYER_AT[((y % TILE) / CELL) * SLOTS + (x % TILE) / CELL];
          if (layer < 0) continue;
          const dx = (x + CELL / 2 - centerX) / RADIUS_X;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > ((LAYERS - layer) / LAYERS) * grown) continue;
          paths[tone(layer)].rect(x, y, CELL, CELL);
        }
      }
      paths.forEach((path, index) => {
        context.fillStyle = colors[index];
        context.fill(path);
      });
    };

    const tick = (now: number) => {
      if (now - lastDraw >= 1000 / FPS) {
        lastDraw = now;
        draw(now);
      }
      if (!done) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [anchorRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    />
  );
}
