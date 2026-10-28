import { describe, expect, it } from "vite-plus/test";
import { sparkline, usageTone } from "@/lib/usage";

describe("usageTone", () => {
  it("turns orange at 60% and red at 85%", () => {
    expect(usageTone(59)).toBe("green");
    expect(usageTone(60)).toBe("orange");
    expect(usageTone(84)).toBe("orange");
    expect(usageTone(85)).toBe("red");
  });
});

describe("sparkline", () => {
  it("spreads the points across the width with the peak at the top", () => {
    const line = sparkline([0, 10, 5]);
    expect(line.points).toBe("0.00,26.00 50.00,2.00 100.00,14.00");
  });

  it("places the average of the earlier days and the last day", () => {
    const line = sparkline([10, 0, 5]);
    expect(line.averageTop).toBe(50);
    expect(line.lastTop).toBe(50);
  });

  it("keeps a flat line on the floor when every day is zero", () => {
    expect(sparkline([0, 0]).points).toBe("0.00,26.00 100.00,26.00");
  });
});
