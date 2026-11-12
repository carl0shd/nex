import { describe, expect, it } from "vite-plus/test";
import {
  completeSetup,
  downloadDetail,
  failStep,
  finishStep,
  newSetup,
  resumeIndex,
  secondsLabel,
  startStep,
} from "@native/environments/setup-steps";

describe("setup steps", () => {
  it("starts with every phase-one step pending", () => {
    const setup = newSetup(1000);
    expect(setup.phase).toBe("running");
    expect(setup.steps.map((step) => step.id)).toEqual(["runtime", "system", "addresses", "check"]);
    expect(setup.steps[2].label).toBe("Register .nex addresses");
    expect(setup.steps.every((step) => step.state === "pending")).toBe(true);
  });

  it("moves through running, done and failed", () => {
    let setup = startStep(newSetup(0), 0);
    setup = finishStep(setup, 0, "Apple container 1.7.1 ready");
    setup = startStep(setup, 1, "Installs the Linux kernel the first time.");
    expect(setup.current).toBe(1);
    expect(setup.steps[0]).toMatchObject({ state: "done", label: "Apple container 1.7.1 ready" });
    expect(setup.steps[1]).toMatchObject({ state: "running" });

    const failed = failStep(setup, 1, "The password dialog was closed.", 5);
    expect(failed.phase).toBe("failed");
    expect(failed.error).toEqual({
      title: "Couldn’t start Apple container",
      detail: "The password dialog was closed.",
    });
    expect(resumeIndex(failed)).toBe(1);
  });

  it("resumes from the start unless the last run failed", () => {
    expect(resumeIndex(null)).toBe(0);
    expect(resumeIndex(completeSetup(newSetup(0), 10))).toBe(0);
  });

  it("finishes with current past the last step", () => {
    const done = completeSetup(newSetup(0), 90_000);
    expect(done).toMatchObject({ phase: "done", current: 4, finishedAt: 90_000 });
  });

  it("describes download progress in MB", () => {
    expect(downloadDetail(45 * 1024 ** 2, 170 * 1024 ** 2)).toBe("Downloading · 45 of 170 MB");
    expect(downloadDetail(3 * 1024 ** 2, 0)).toBe("Downloading · 3 MB");
  });

  it("shows how fast the test container started", () => {
    expect(secondsLabel(612)).toBe("0.6s");
    expect(secondsLabel(0)).toBe("0.1s");
  });
});
