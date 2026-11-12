import { describe, expect, it } from "vite-plus/test";
import type { CleanBaseState } from "@native/environments/types";
import { dataCopyView, failureSteps, sizeLabel } from "@/lib/clean-base";

const NOW = Date.UTC(2026, 10, 8, 12);
const HOUR = 3_600_000;

const state = (overrides: Partial<CleanBaseState>): CleanBaseState => ({
  projectId: "p",
  projectPath: "/p",
  status: "none",
  services: ["postgres"],
  steps: [
    { label: "Start the services", state: "pending" },
    { label: "npm run db:seed", code: true, detail: "web", state: "pending" },
    { label: "Stop the databases cleanly", state: "pending" },
    { label: "Save the clean base", state: "pending" },
  ],
  ...overrides,
});

describe("dataCopyView", () => {
  it("says what a ready copy came from", () => {
    const view = dataCopyView(
      state({
        status: "ready",
        builtAt: NOW - 2 * HOUR,
        branch: "main",
        commit: "abc1234def",
        sizeBytes: 340e6,
      }),
      NOW,
    );
    expect(view).toMatchObject({
      title: "Copy of main · abc1234",
      hint: "2h ago · 340 MB · every task starts here",
      action: "rebuild",
      actionLabel: "Rebuild",
    });
    expect(dataCopyView(state({ status: "ready", builtAt: NOW }), NOW).title).toBe(
      "Copy of the main checkout",
    );
  });

  it("explains why a copy is out of date", () => {
    const stale = state({ status: "stale", stale: "migrations", branch: "main", builtAt: NOW });
    expect(dataCopyView(stale, NOW)).toMatchObject({
      title: "The copy is out of date",
      tone: "orange",
      hint: "main has new migrations · Built just now from main",
    });
    expect(dataCopyView({ ...stale, stale: "setup" }, NOW).hint).toMatch(/^The data services/);
  });

  it("counts the steps while it copies, and offers to stop", () => {
    const building = state({
      status: "building",
      steps: [
        { label: "Start the services", state: "done" },
        { label: "npm run db:seed", code: true, detail: "web", state: "running" },
        { label: "Save the clean base", state: "pending" },
      ],
    });
    expect(dataCopyView(building, NOW)).toMatchObject({
      busy: true,
      action: "stop",
      title: "Copying the data… 1 of 3",
      hint: "npm run db:seed",
    });
  });

  it("offers to build, shows what failed, or nothing when no service keeps data", () => {
    expect(dataCopyView(state({}), NOW)).toMatchObject({
      title: "No copy yet",
      action: "build",
      actionLabel: "Build a copy",
    });
    expect(dataCopyView(state({ status: "failed", error: "boom" }), NOW)).toMatchObject({
      title: "The copy failed",
      tone: "red",
      action: "details",
      hint: "boom",
    });
    expect(dataCopyView(state({ services: [] }), NOW).action).toBeNull();
    expect(dataCopyView(null, NOW)).toMatchObject({ title: "No copy yet", action: null });
  });
});

describe("clean base helpers", () => {
  it("formats sizes", () => {
    expect(sizeLabel(340e6)).toBe("340 MB");
    expect(sizeLabel(1.42e9)).toBe("1.4 GB");
  });

  it("leaves the error out of the failed step, since the dialog shows it", () => {
    const failed = state({
      status: "failed",
      steps: [
        { label: "Start the services", detail: "2 ready", state: "done" },
        { label: "npm run db:seed", detail: "relation exists", state: "failed" },
      ],
    });
    expect(failureSteps(failed)).toEqual([
      { label: "Start the services", detail: "2 ready", state: "done" },
      { label: "npm run db:seed", state: "failed" },
    ]);
  });
});
