import { describe, expect, it } from "vite-plus/test";
import type { EnvironmentStatus, EnvSetupState } from "@native/environments/types";
import {
  environmentsUsage,
  envPhase,
  formatTook,
  memoryBudget,
  runtimeCard,
  runtimeDetail,
  settingsEnvironments,
  shownMemory,
  timeLeftLabel,
  unsupportedCopy,
} from "@/lib/environments";

const STATUS: EnvironmentStatus = {
  supported: true,
  reasonUnsupported: null,
  macos: "26.6.2",
  hostMemoryGb: 32,
  memoryChoices: [4, 8, 12, 16],
  enabled: false,
  runtime: {
    installed: true,
    version: "1.7.1",
    path: "/usr/local/bin/container",
    compatible: true,
    installedByNex: false,
    running: true,
  },
  dns: { domain: "nex", registered: true },
  usage: { containers: 3, running: 2, usedGb: 0.2 },
  setup: null,
};

const SETUP: EnvSetupState = {
  phase: "running",
  current: 0,
  startedAt: 0,
  steps: [
    { id: "runtime", label: "Install Apple container", state: "running" },
    { id: "system", label: "Start Apple container", state: "pending" },
    { id: "addresses", label: "Register .nex addresses", state: "pending" },
    { id: "check", label: "Check that a task can run", state: "pending" },
  ],
};

describe("envPhase", () => {
  it("follows support, the live setup and whether it is enabled", () => {
    expect(envPhase({ ...STATUS, supported: false }, null)).toBe("unsupported");
    expect(envPhase(STATUS, null)).toBe("offer");
    expect(envPhase(STATUS, SETUP)).toBe("running");
    expect(envPhase(STATUS, { ...SETUP, phase: "failed" })).toBe("failed");
    expect(envPhase(STATUS, { ...SETUP, phase: "done" })).toBe("ready");
    expect(envPhase({ ...STATUS, enabled: true }, null)).toBe("ready");
  });
});

describe("labels", () => {
  it("estimates the time left from the steps not done", () => {
    expect(timeLeftLabel(SETUP)).toBe("About 1 min left");
    expect(timeLeftLabel({ ...SETUP, steps: SETUP.steps.slice(1) })).toBe(
      "Less than a minute left",
    );
  });

  it("formats how long setup took", () => {
    expect(formatTook(42_000)).toBe("42s");
    expect(formatTook(108_000)).toBe("1 min 48s");
    expect(formatTook(120_000)).toBe("2 min");
  });

  it("explains why a Mac is unsupported", () => {
    expect(unsupportedCopy({ ...STATUS, macos: "15.6" }).description).toContain("macOS 15.6");
    expect(unsupportedCopy({ ...STATUS, reasonUnsupported: "arch" }).title).toBe(
      "Environments need Apple silicon",
    );
  });

  it("describes the runtime install", () => {
    expect(runtimeDetail(STATUS)).toBe("Already on this Mac · 1.7.1");
    expect(
      runtimeDetail({
        ...STATUS,
        runtime: { ...STATUS.runtime, installed: false, compatible: false },
      }),
    ).toBe("Container runtime made by Apple · about 160 MB");
  });
});

describe("shownMemory", () => {
  it("keeps the preference when it fits, else 8 GB or the largest choice", () => {
    expect(shownMemory([4, 8, 12, 16], "12")).toBe("12");
    expect(shownMemory([4, 8, 12], "16")).toBe("8");
    expect(shownMemory([4], "8")).toBe("4");
  });
});

describe("runtime and usage", () => {
  it("measures running Nex containers against the memory budget", () => {
    expect(memoryBudget(STATUS, "12")).toBe(12);
    expect(memoryBudget({ ...STATUS, memoryChoices: [4] }, "12")).toBe(4);
    expect(environmentsUsage(STATUS, 8)).toEqual({
      usedGb: 0.2,
      totalGb: 8,
      containers: 2,
      idle: 0,
      environments: [],
    });
  });

  it("shows restarting, repairing and missing addresses on the runtime card", () => {
    expect(runtimeCard(STATUS, null, 8)).toEqual({
      state: "running",
      version: "1.7.1",
      addresses: "registered",
      containers: 2,
      usedGb: 0.2,
      budgetGb: 8,
    });
    expect(runtimeCard(STATUS, "restarting", 8).state).toBe("restarting");
    expect(runtimeCard(STATUS, "repairing", 8).addresses).toBe("repairing");
    const down = { ...STATUS, runtime: { ...STATUS.runtime, running: false } };
    expect(
      runtimeCard({ ...down, dns: { domain: "nex", registered: false } }, null, 8),
    ).toMatchObject({ state: "stopped", addresses: "missing" });
  });

  it("shows setup progress in settings only until environments are enabled", () => {
    expect(settingsEnvironments(STATUS, SETUP, null, "8").setup?.phase).toBe("running");
    expect(settingsEnvironments({ ...STATUS, enabled: true }, SETUP, null, "8").setup).toBeNull();
    expect(settingsEnvironments(STATUS, null, "removing", "8")).toMatchObject({
      removing: true,
      containers: 3,
    });
  });
});
