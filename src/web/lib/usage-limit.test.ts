import { describe, expect, it } from "vite-plus/test";
import { limitResetAt } from "@/lib/usage-limit";

const now = new Date("2026-11-05T14:00:00");

describe("limitResetAt", () => {
  it("reads the epoch Claude Code appends", () => {
    expect(limitResetAt("Claude usage limit reached|1793901600", now)?.getTime()).toBe(
      1793901600 * 1000,
    );
  });

  it("reads a clock time later today", () => {
    const at = limitResetAt("You've hit your limit · resets 5pm (America/Bogota)", now);
    expect(at?.getHours()).toBe(17);
    expect(at?.getDate()).toBe(5);
  });

  it("moves an earlier clock time to tomorrow", () => {
    const at = limitResetAt("Limit reached. Resets at 9:30am", now);
    expect([at?.getDate(), at?.getHours(), at?.getMinutes()]).toEqual([6, 9, 30]);
  });

  it("gives up when there is no time", () => {
    expect(limitResetAt("usage limit reached", now)).toBeNull();
  });
});
