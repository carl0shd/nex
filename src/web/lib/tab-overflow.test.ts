import { describe, expect, it } from "vite-plus/test";
import { fitTabs } from "@/lib/tab-overflow";

const base = { widths: [50, 50, 50, 50], gap: 4, moreWidth: 30 };

describe("fitTabs", () => {
  it("shows every tab when they fit", () => {
    expect(fitTabs({ ...base, active: 0, available: 216 })).toEqual({
      visible: [0, 1, 2, 3],
      hidden: [],
    });
  });

  it("moves the overflow behind the more chip", () => {
    expect(fitTabs({ ...base, active: 0, available: 150 })).toEqual({
      visible: [0, 1],
      hidden: [2, 3],
    });
  });

  it("keeps the active tab visible", () => {
    expect(fitTabs({ ...base, active: 3, available: 150 })).toEqual({
      visible: [0, 3],
      hidden: [1, 2],
    });
  });

  it("keeps the active tab when nothing else fits", () => {
    expect(fitTabs({ ...base, active: 2, available: 40 })).toEqual({
      visible: [2],
      hidden: [0, 1, 3],
    });
  });
});
