import { describe, expect, it } from "vite-plus/test";
import { starBob, starField, starGlow, wrap } from "@/lib/dither";

describe("star field", () => {
  it("lays out the same stars every time", () => {
    expect(starField(20, 7)).toEqual(starField(20, 7));
  });

  it("glows in three steps so it reads as dither", () => {
    const levels = new Set(
      Array.from({ length: 200 }, (_, index) => starGlow(starField(1, 3)[0], index * 37)),
    );
    expect([...levels].every((level) => [0.3, 0.6, 1].includes(level))).toBe(true);
  });

  it("only moves the stars that bob", () => {
    const star = { ...starField(1, 5)[0], motion: "twinkle" as const };
    expect(starBob(star, 1234)).toBe(0);
  });

  it("wraps positions around the field", () => {
    expect(wrap(-5, 100)).toBe(95);
    expect(wrap(105, 100)).toBe(5);
  });
});
