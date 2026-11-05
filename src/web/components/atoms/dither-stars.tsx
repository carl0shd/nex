import { useEffect, useRef } from "react";
import { seeded, starBob, starField, starGlow, wrap, type Star } from "@/lib/dither";
import { readCssToken } from "@/lib/terminal-theme";
import { cn } from "@/lib/utils";

const FRAME_MS = 1000 / 24;
const LAYERS = [
  { count: 520, seed: 7, speed: 4, size: 1, alpha: 0.45 },
  { count: 240, seed: 23, speed: 11, size: 2, alpha: 0.7 },
  { count: 80, seed: 41, speed: 24, size: 2, alpha: 1 },
];
const SPARKLE_EVERY_MS = 3000;
const SPARKLE_MS = 640;
const METEOR_EVERY_MS = 10_000;
const FIRST_METEOR_MS = 2000;
const METEOR_MS = 900;
const METEOR_SPEED = { x: -300, y: 46 };
const TRAIL = 12;

interface Layer {
  stars: Star[];
  speed: number;
  size: number;
  alpha: number;
}

interface Sparkle {
  x: number;
  y: number;
  born: number;
}

interface Meteor {
  x: number;
  y: number;
  born: number;
}

function drawFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  layers: readonly Layer[],
  sparkles: readonly Sparkle[],
  meteors: readonly Meteor[],
  colors: { dim: string; bright: string },
) {
  context.clearRect(0, 0, width, height);
  for (const layer of layers) {
    for (const star of layer.stars) {
      const x = Math.round(wrap(star.x * width - (layer.speed * time) / 1000, width));
      const y = Math.round(star.y * (height - layer.size)) + starBob(star, time);
      context.globalAlpha = layer.alpha * starGlow(star, time);
      context.fillStyle = star.bright ? colors.bright : colors.dim;
      context.fillRect(x, y, layer.size, layer.size);
    }
  }
  context.fillStyle = colors.bright;
  for (const sparkle of sparkles) {
    const age = (time - sparkle.born) / SPARKLE_MS;
    const arm = age < 0.33 ? 1 : age < 0.66 ? 2 : 1;
    context.globalAlpha = age < 0.66 ? 1 : 0.5;
    context.fillRect(sparkle.x, sparkle.y, 1, 1);
    for (let step = 1; step <= arm; step++) {
      context.fillRect(sparkle.x + step * 2, sparkle.y, 1, 1);
      context.fillRect(sparkle.x - step * 2, sparkle.y, 1, 1);
      context.fillRect(sparkle.x, sparkle.y + step * 2, 1, 1);
      context.fillRect(sparkle.x, sparkle.y - step * 2, 1, 1);
    }
  }
  for (const meteor of meteors) {
    const seconds = (time - meteor.born) / 1000;
    const headX = meteor.x + METEOR_SPEED.x * seconds;
    const headY = meteor.y + METEOR_SPEED.y * seconds;
    for (let index = 0; index < TRAIL; index++) {
      context.globalAlpha = 1 - index / TRAIL;
      context.fillRect(
        Math.round(headX - (METEOR_SPEED.x / 100) * index * 1.5),
        Math.round(headY - (METEOR_SPEED.y / 100) * index * 1.5),
        index === 0 ? 2 : 1,
        index === 0 ? 2 : 1,
      );
    }
  }
  context.globalAlpha = 1;
}

export function DitherStars({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const layers: Layer[] = LAYERS.map((layer) => ({
      ...layer,
      stars: starField(layer.count, layer.seed),
    }));
    const random = seeded(99);
    const sparkles: Sparkle[] = [];
    const meteors: Meteor[] = [];
    let colors = { dim: "", bright: "" };
    const readColors = () => {
      colors = { dim: readCssToken("--accent"), bright: readCssToken("--accent-ink") };
    };
    readColors();

    let width = 0;
    let height = 0;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.imageSmoothingEnabled = false;
    };
    resize();

    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("motion-reduce");
    let frame = 0;
    let visible = false;
    let last = 0;
    let nextSparkle = 0;
    let nextMeteor = 0;

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (time - last < FRAME_MS) return;
      last = time;
      if (time >= nextSparkle) {
        const near = layers[layers.length - 1];
        const star = near.stars[Math.floor(random() * near.stars.length)];
        sparkles.push({
          x: Math.round(wrap(star.x * width - (near.speed * time) / 1000, width)),
          y: Math.round(star.y * (height - 2)),
          born: time,
        });
        nextSparkle = time + SPARKLE_EVERY_MS;
      }
      if (nextMeteor === 0) nextMeteor = time + FIRST_METEOR_MS;
      if (time >= nextMeteor) {
        meteors.push({
          x: width * (0.55 + random() * 0.45),
          y: random() * height * 0.4,
          born: time,
        });
        nextMeteor = time + METEOR_EVERY_MS;
      }
      while (sparkles[0] && time - sparkles[0].born > SPARKLE_MS) sparkles.shift();
      while (meteors[0] && time - meteors[0].born > METEOR_MS) meteors.shift();
      drawFrame(context, width, height, time, layers, sparkles, meteors, colors);
    };

    const run = () => {
      cancelAnimationFrame(frame);
      if (still || !visible) {
        drawFrame(context, width, height, 0, layers, [], [], colors);
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const sizing = new ResizeObserver(() => {
      resize();
      if (still || !visible) run();
    });
    sizing.observe(canvas);
    const viewing = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      run();
    });
    viewing.observe(canvas);
    const theme = new MutationObserver(() => {
      readColors();
      if (still || !visible) run();
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    run();

    return () => {
      cancelAnimationFrame(frame);
      sizing.disconnect();
      viewing.disconnect();
      theme.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("dither-stars pointer-events-none absolute inset-0 size-full", className)}
    />
  );
}
