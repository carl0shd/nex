import type { HomeScene } from "@native/db/types";
import { seeded, starField, starGlow, type Star } from "@/lib/dither";

export type ScenePhase = "dawn" | "day" | "dusk" | "night";

export const SCENE_PHASES: readonly ScenePhase[] = ["dawn", "day", "dusk", "night"];
export const SCENE_LEVELS = 3;
export const HORIZON = 0.66;

export function scenePhase(hour: number): ScenePhase {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 17) return "day";
  if (hour >= 17 && hour < 18.5) return "dusk";
  return "night";
}

export function homeScenePhase(scene: HomeScene, hour: number): ScenePhase | null {
  if (scene === "off") return null;
  return scene === "time" ? scenePhase(hour) : scene;
}

export const SCENE_PHASE_LABELS: Record<ScenePhase, string> = {
  dawn: "Dawn",
  day: "Day",
  dusk: "Dusk",
  night: "Night",
};

export function formatHour(hour: number): string {
  const minutes = Math.round(hour * 60) % (24 * 60);
  const hours = Math.floor(minutes / 60);
  const clock = `${((hours + 11) % 12) + 1}:${String(minutes % 60).padStart(2, "0")}`;
  return `${clock} ${hours < 12 ? "am" : "pm"}`;
}

export function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

interface SceneLook {
  light: { x: number; y: number; radius: number; moon: boolean };
  skyTop: number;
  skyHorizon: number;
  glow: number;
  cloudShade: number;
  cloudLit: number;
  sea: number;
  wave: number;
  reflect: number;
  stars: boolean;
}

export const SCENE_LOOK: Record<ScenePhase, SceneLook> = {
  dawn: {
    light: { x: 0.2, y: 0.6, radius: 0.07, moon: false },
    skyTop: 0.12,
    skyHorizon: 0.4,
    glow: 0.45,
    cloudShade: 0.5,
    cloudLit: 0.55,
    sea: 0.2,
    wave: 0.4,
    reflect: 0.7,
    stars: false,
  },
  day: {
    light: { x: 0.82, y: 0.16, radius: 0.05, moon: false },
    skyTop: 0.3,
    skyHorizon: 0.5,
    glow: 0.18,
    cloudShade: 0.52,
    cloudLit: 0.95,
    sea: 0.26,
    wave: 0.35,
    reflect: 0.4,
    stars: false,
  },
  dusk: {
    light: { x: 0.8, y: 0.6, radius: 0.075, moon: false },
    skyTop: 0.1,
    skyHorizon: 0.42,
    glow: 0.5,
    cloudShade: 0.48,
    cloudLit: 0.6,
    sea: 0.18,
    wave: 0.4,
    reflect: 0.75,
    stars: false,
  },
  night: {
    light: { x: 0.82, y: 0.24, radius: 0.05, moon: true },
    skyTop: 0.04,
    skyHorizon: 0.2,
    glow: 0.3,
    cloudShade: 0.32,
    cloudLit: 0.5,
    sea: 0.1,
    wave: 0.34,
    reflect: 0.7,
    stars: true,
  },
};

const SCREEN = [0, 12, 3, 15, 8, 4, 11, 7, 2, 14, 1, 13, 10, 6, 9, 5];

export function ditherLevel(value: number, x: number, y: number, levels: number): number {
  const threshold = (SCREEN[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  const scaled = Math.min(1, Math.max(0, value)) * (levels - 1);
  const base = Math.floor(scaled);
  return Math.min(levels - 1, base + (scaled - base > threshold ? 1 : 0));
}

export function packColor(hex: string): number {
  const value = Number.parseInt(hex.replace("#", "").slice(0, 6), 16);
  if (Number.isNaN(value)) return 0;
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return ((255 << 24) | (blue << 16) | (green << 8) | red) >>> 0;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const smoothstep = (low: number, high: number, value: number) =>
  smooth(Math.min(1, Math.max(0, (value - low) / (high - low))));

export function noiseField(
  width: number,
  height: number,
  cells: { x: number; y: number },
  octaves: number,
  seed: number,
): Float32Array {
  const random = seeded(seed);
  const field = new Float32Array(width * height);
  let total = 0;
  for (let octave = 0; octave < octaves; octave++) {
    const columns = cells.x << octave;
    const rows = cells.y << octave;
    const lattice = Float32Array.from({ length: columns * rows }, random);
    const amplitude = 1 / (1 << octave);
    total += amplitude;
    for (let y = 0; y < height; y++) {
      const gy = (y / height) * rows;
      const row = Math.floor(gy);
      const ty = smooth(gy - row);
      const top = (row % rows) * columns;
      const bottom = ((row + 1) % rows) * columns;
      for (let x = 0; x < width; x++) {
        const gx = (x / width) * columns;
        const column = Math.floor(gx);
        const tx = smooth(gx - column);
        const left = column % columns;
        const right = (column + 1) % columns;
        const upper = lattice[top + left] + (lattice[top + right] - lattice[top + left]) * tx;
        const lower =
          lattice[bottom + left] + (lattice[bottom + right] - lattice[bottom + left]) * tx;
        field[y * width + x] += (upper + (lower - upper) * ty) * amplitude;
      }
    }
  }
  for (let index = 0; index < field.length; index++) field[index] /= total;
  return field;
}

const wrapIndex = (value: number, size: number) => ((Math.floor(value) % size) + size) % size;
const wrapDistance = (delta: number, size: number) =>
  Math.abs(delta - Math.round(delta / size) * size);

interface Puff {
  x: number;
  y: number;
  radius: number;
  base: number;
}

interface LightSpot {
  x: number;
  y: number;
  radius: number;
}

function cloudPuffs(width: number, height: number, light: LightSpot): Puff[] {
  const random = seeded(17);
  const puffs: Puff[] = [];
  const clusters = Math.max(2, Math.round(width / (height * 0.95)));
  for (let cluster = 0; cluster < clusters; cluster++) {
    const centerX = light.x + ((cluster + 0.4 + random() * 0.2) / clusters) * width;
    const base = height * (0.52 + random() * 0.2);
    const size = height * (0.17 + random() * 0.1);
    const spread = size * (2.2 + random() * 1.4);
    const count = 26 + Math.floor(random() * 12);
    for (let index = 0; index < count; index++) {
      const offset = (random() * 2 - 1) * spread;
      const middle = 1 - Math.abs(offset) / spread;
      const radius = size * (0.3 + 0.7 * middle) * (0.45 + random() * 0.6);
      const lift = random() * size * 1.8 * middle;
      const floor = base + (random() - 0.5) * size * 0.4;
      const x = centerX + offset;
      const y = floor - radius * 0.55 - lift;
      const clear = radius * 1.45 + light.radius * 1.6;
      if (Math.hypot(wrapDistance(x - light.x, width), y - light.y) < clear) continue;
      puffs.push({ x, y, radius, base: floor });
    }
  }
  return puffs.sort((a, b) => a.y - b.y);
}

const LIGHT = { x: -0.35, y: -0.75, z: 0.56 };

function cumulus(width: number, height: number, light: LightSpot) {
  const cover = new Float32Array(width * height);
  const shade = new Float32Array(width * height);
  const detail = noiseField(width, height, { x: 24, y: 12 }, 4, 41);
  for (const puff of cloudPuffs(width, height, light)) {
    const reach = puff.radius * 1.45;
    const bottom = Math.min(height - 1, Math.ceil(puff.base + puff.radius * 0.4));
    for (let y = Math.max(0, Math.floor(puff.y - reach)); y <= bottom; y++) {
      const fade = smoothstep(puff.base + puff.radius * 0.4, puff.base - puff.radius * 1.8, y);
      const underside = 0.35 + 0.65 * smoothstep(puff.base, puff.base - puff.radius * 1.4, y);
      for (let dx = -Math.ceil(reach); dx <= reach; dx++) {
        const x = wrapIndex(puff.x + dx, width);
        const index = y * width + x;
        const nx = (Math.round(puff.x + dx) - puff.x) / puff.radius;
        const ny = (y - puff.y) / puff.radius;
        const distance = Math.hypot(nx, ny) - (detail[index] - 0.5) * 0.7;
        const inside = smoothstep(1, 0.86, distance) * fade;
        if (inside <= 0) continue;
        const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, nx * nx + ny * ny)));
        const light = Math.max(0, nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z) ** 1.6;
        shade[index] =
          shade[index] + (light * underside * (0.4 + 1.1 * detail[index]) - shade[index]) * inside;
        cover[index] = Math.max(cover[index], inside);
      }
    }
  }
  return { cover, shade };
}

const WATER = { width: 256, height: 128 };
const WAVE_WIDTH = 280;
const WAVE_DEPTH = 0.4;
const DIM = 0.72;
const CLOUD_SPEED = 1.4;
const WAVE_DRIFT = 2.4;
const WAVE_APPROACH = 1.2;
const METEOR_EVERY_MS = 12_000;
const METEOR_MS = 800;
const TRAIL = 10;

export interface SceneBuffers {
  width: number;
  height: number;
  horizon: number;
  base: Float32Array;
  column: Float32Array;
  quiet: Float32Array;
  waterU: Float32Array;
  waterV: Float32Array;
  clouds: Float32Array;
  cloudShade: Float32Array;
  water: Float32Array;
  stars: Star[];
  levels: Uint8Array;
}

function cloudFields(width: number, height: number, light: LightSpot) {
  const { cover, shade } = cumulus(width, height, light);
  return { clouds: cover, cloudShade: shade };
}

export function sceneBuffers(
  width: number,
  height: number,
  phase: ScenePhase,
  focusX = 0.5,
): SceneBuffers {
  const look = SCENE_LOOK[phase];
  const horizon = Math.round(height * HORIZON);
  const size = width * height;
  const base = new Float32Array(size);
  const column = new Float32Array(size);
  const quiet = new Float32Array(size);
  const lightX = look.light.x * width;
  const lightY = look.light.y * height;
  const radius = look.light.radius * height;
  const centerX = width * focusX;
  const centerY = height * 0.45;
  const waterU = new Float32Array(width * (height - horizon));
  const waterV = new Float32Array(height - horizon);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      quiet[index] =
        1 -
        0.72 *
          Math.exp(
            -(((x - centerX) / (width * 0.38)) ** 2) - ((y - centerY) / (height * 0.28)) ** 2,
          );
      if (y < horizon) {
        const v = y / horizon;
        const distance = Math.hypot(x - lightX, y - lightY);
        const glow = look.glow * Math.exp(-Math.max(0, distance - radius) / (height * 0.14));
        const sky = look.skyTop + (look.skyHorizon - look.skyTop) * v * v;
        base[index] = distance < radius ? -1 : sky + glow;
        column[index] = glow;
      } else {
        const depth = (y - horizon) / (height - horizon);
        const spread = radius * (1.4 + depth * 3.2);
        const reflection = Math.exp(-(((x - lightX) / spread) ** 2));
        base[index] = look.sea * (1.1 - depth * 0.3) + look.glow * 0.3 * (1 - depth);
        column[index] = look.reflect * reflection;
        waterU[(y - horizon) * width + x] = ((x - centerX) * WAVE_WIDTH) / width / (depth + 0.15);
      }
    }
  }
  for (let y = horizon; y < height; y++) {
    waterV[y - horizon] =
      (WAVE_DEPTH * (height - horizon)) / ((y - horizon) / (height - horizon) + 0.15);
  }

  return {
    width,
    height,
    horizon,
    base,
    column,
    quiet,
    waterU,
    waterV,
    ...cloudFields(width, horizon, { x: lightX, y: lightY, radius }),
    water: noiseField(WATER.width, WATER.height, { x: 8, y: 32 }, 3, 29),
    stars: look.stars ? starField(Math.round((width * horizon) / 220), 53) : [],
    levels: new Uint8Array(size),
  };
}

const moonShade = (x: number, y: number, width: number, texture: Float32Array) =>
  0.85 + 0.2 * texture[y * width + wrapIndex(x * 3, width)];

export function renderScene(
  buffers: SceneBuffers,
  phase: ScenePhase,
  time: number,
  palette: Uint32Array,
  pixels: Uint32Array,
) {
  const look = SCENE_LOOK[phase];
  const { width, height, horizon, base, column, quiet, clouds, cloudShade, water, levels } =
    buffers;
  const seconds = time / 1000;
  const cloudShift = seconds * CLOUD_SPEED;
  const top = SCENE_LEVELS - 1;

  for (let y = 0; y < horizon; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const disc = base[index] < 0;
      const sky = disc ? (look.light.moon ? moonShade(x, y, width, cloudShade) : 1) : base[index];
      const cloud = y * width + wrapIndex(x + cloudShift, width);
      const lit = look.cloudShade + look.cloudLit * cloudShade[cloud] + column[index] * 0.3;
      const value = sky + clouds[cloud] * (lit - sky);
      levels[index] = ditherLevel(disc ? value : value * quiet[index] * DIM, x, y, SCENE_LEVELS);
    }
  }

  for (let y = horizon; y < height; y++) {
    const row = y - horizon;
    const waterRow = wrapIndex(buffers.waterV[row] + seconds * WAVE_APPROACH, WATER.height);
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const u = wrapIndex(buffers.waterU[row * width + x] + seconds * WAVE_DRIFT, WATER.width);
      const crest = smoothstep(0.62, 0.74, water[waterRow * WATER.width + u]);
      const value = base[index] + crest * look.wave + column[index] * (0.1 + crest * 0.9);
      levels[index] = ditherLevel(value * quiet[index] * DIM, x, y, SCENE_LEVELS);
    }
  }

  for (const star of buffers.stars) {
    const x = Math.floor(star.x * width);
    const y = Math.floor(star.y * horizon * 0.92);
    const index = y * width + x;
    if (base[index] < 0 || clouds[y * width + wrapIndex(x + cloudShift, width)] > 0.2) {
      continue;
    }
    const glow = starGlow(star, time);
    levels[index] = Math.max(
      levels[index],
      star.bright ? Math.round(glow * top) : glow >= 1 ? 1 : 0,
    );
  }

  if (look.stars) drawMeteor(levels, width, horizon, time);

  for (let index = 0; index < levels.length; index++) pixels[index] = palette[levels[index]];
}

function drawMeteor(levels: Uint8Array, width: number, horizon: number, time: number) {
  const cycle = Math.floor(time / METEOR_EVERY_MS);
  const age = time - cycle * METEOR_EVERY_MS;
  if (cycle === 0 || age > METEOR_MS) return;
  const random = seeded(cycle * 7919);
  const startX = width * (0.35 + random() * 0.4);
  const startY = horizon * (0.08 + random() * 0.3);
  const travel = (age / METEOR_MS) * width * 0.18;
  for (let step = 0; step < TRAIL; step++) {
    const x = Math.round(startX - travel + step * 1.6);
    const y = Math.round(startY + (travel - step * 1.6) * 0.32);
    if (x < 0 || x >= width || y < 0 || y >= horizon) continue;
    levels[y * width + x] = Math.max(levels[y * width + x], step < 3 ? SCENE_LEVELS - 1 : 1);
  }
}
