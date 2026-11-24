import { describe, expect, it } from "vite-plus/test";
import {
  homeScenePhase,
  ditherLevel,
  formatHour,
  greeting,
  HORIZON,
  noiseField,
  packColor,
  renderScene,
  SCENE_LEVELS,
  SCENE_LOOK,
  SCENE_PHASES,
  sceneBuffers,
  scenePhase,
} from "@/lib/dither-scene";

describe("time of day", () => {
  it("picks the scene from the hour", () => {
    expect(scenePhase(4.9)).toBe("night");
    expect(scenePhase(6)).toBe("dawn");
    expect(scenePhase(12)).toBe("day");
    expect(scenePhase(17.5)).toBe("dusk");
    expect(scenePhase(18.9)).toBe("night");
    expect(scenePhase(23)).toBe("night");
  });

  it("greets for the part of the day", () => {
    expect(greeting(7)).toBe("Good morning");
    expect(greeting(15)).toBe("Good afternoon");
    expect(greeting(21)).toBe("Good evening");
    expect(greeting(2)).toBe("Good evening");
  });
});

describe("the time preview", () => {
  it("formats an hour of the day as a 12-hour clock", () => {
    expect(formatHour(0)).toBe("12:00 am");
    expect(formatHour(6.5)).toBe("6:30 am");
    expect(formatHour(12)).toBe("12:00 pm");
    expect(formatHour(18.9)).toBe("6:54 pm");
    expect(formatHour(23.75)).toBe("11:45 pm");
  });
});

describe("dithering", () => {
  it("keeps the extremes solid", () => {
    for (let index = 0; index < 16; index++) {
      expect(ditherLevel(0, index % 4, index >> 2, SCENE_LEVELS)).toBe(0);
      expect(ditherLevel(1, index % 4, index >> 2, SCENE_LEVELS)).toBe(SCENE_LEVELS - 1);
    }
  });

  it("mixes two neighbouring levels in proportion inside a 4×4 cell", () => {
    const cell = Array.from({ length: 16 }, (_, index) =>
      ditherLevel(0.375, index % 4, index >> 2, SCENE_LEVELS),
    );
    expect(new Set(cell)).toEqual(new Set([0, 1]));
    expect(cell.filter((level) => level === 1)).toHaveLength(12);
  });

  it("packs a hex color for a little-endian pixel buffer", () => {
    expect(packColor("#ff8000")).toBe(0xff0080ff);
    expect(packColor("")).toBe(0);
  });
});

describe("the scene", () => {
  it("makes noise that tiles sideways, so clouds drift without a seam", () => {
    const field = noiseField(64, 8, { x: 4, y: 2 }, 3, 1);
    for (let y = 0; y < 8; y++) {
      const first = field[y * 64];
      const last = field[y * 64 + 63];
      expect(Math.abs(first - last)).toBeLessThan(0.15);
    }
    expect(Math.min(...field)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...field)).toBeLessThanOrEqual(1);
  });

  it("paints every pixel with a palette color in every phase", () => {
    const palette = Uint32Array.from({ length: SCENE_LEVELS }, (_, level) => level + 1);
    for (const phase of SCENE_PHASES) {
      const buffers = sceneBuffers(120, 80, phase);
      const pixels = new Uint32Array(120 * 80);
      renderScene(buffers, phase, 1234, palette, pixels);
      expect(buffers.horizon).toBe(Math.round(80 * HORIZON));
      expect(pixels.every((pixel) => pixel >= 1 && pixel <= SCENE_LEVELS)).toBe(true);
    }
  });

  it("keeps the sun or moon clear of clouds when the scene starts", () => {
    for (const phase of SCENE_PHASES) {
      const { light } = SCENE_LOOK[phase];
      const buffers = sceneBuffers(480, 300, phase);
      const x = Math.floor(light.x * 480);
      const y = Math.floor(light.y * 300);
      expect(buffers.clouds[y * 480 + x]).toBeLessThan(0.01);
    }
  });
});

describe("homeScenePhase", () => {
  it("follows the hour, keeps a chosen phase or turns the scene off", () => {
    expect(homeScenePhase("time", 22)).toBe("night");
    expect(homeScenePhase("dawn", 22)).toBe("dawn");
    expect(homeScenePhase("off", 12)).toBeNull();
  });
});
