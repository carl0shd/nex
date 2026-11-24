export const DITHER_COLUMN_START_PX = 12;
export const DITHER_COLUMN_STEP_PX = 21;

export const ditherColumnAtX = (x: number) => (x - DITHER_COLUMN_START_PX) / DITHER_COLUMN_STEP_PX;

export const DITHER_OFFSETS = [
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

export function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export type StarMotion = "twinkle" | "pulse" | "bob";

export interface Star {
  x: number;
  y: number;
  bright: boolean;
  motion: StarMotion;
  period: number;
  phase: number;
}

export function starField(count: number, seed: number): Star[] {
  const random = seeded(seed);
  return Array.from({ length: count }, () => {
    const roll = random();
    return {
      x: random(),
      y: random(),
      bright: random() < 0.18,
      motion: roll < 0.1 ? "pulse" : roll < 0.25 ? "bob" : "twinkle",
      period: 1600 + random() * 3600,
      phase: random() * Math.PI * 2,
    };
  });
}

const LEVELS = [0.3, 0.6, 1];

export function starGlow(star: Star, time: number): number {
  const wave = Math.sin((time / star.period) * Math.PI * 2 + star.phase);
  if (star.motion === "pulse") return wave > 0.92 ? 1 : LEVELS[0];
  return LEVELS[Math.min(LEVELS.length - 1, Math.floor(((wave + 1) / 2) * LEVELS.length))];
}

export function starBob(star: Star, time: number): number {
  if (star.motion !== "bob") return 0;
  return Math.round(Math.sin((time / star.period) * Math.PI * 2 + star.phase) * 1.5);
}

export function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}
