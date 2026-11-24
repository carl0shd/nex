import { describe, expect, it } from "vite-plus/test";
import { commandsPhrase, listPhrase, phraseText, setupPhrase } from "@/lib/project-summary";

const SETUP = {
  install: { on: true, command: "yarn install" },
  copy: { on: true, files: [".env"] },
  script: { on: false, path: "scripts/setup.sh" },
};

describe("listPhrase", () => {
  it("joins with commas and a final and", () => {
    expect(phraseText(listPhrase(["dev", "test", "lint"]))).toBe("dev, test and lint");
    expect(listPhrase(["dev"])).toEqual([{ text: "dev", name: true }]);
  });
});

describe("setupPhrase", () => {
  it("describes what each worktree does", () => {
    expect(phraseText(setupPhrase(SETUP))).toBe("Each worktree runs yarn install and copies .env");
  });

  it("lists three steps with commas", () => {
    const all = { ...SETUP, script: { on: true, path: "scripts/setup.sh" } };
    expect(phraseText(setupPhrase(all))).toBe(
      "Each worktree runs yarn install, copies .env and runs scripts/setup.sh",
    );
  });

  it("says so when nothing runs", () => {
    const none = {
      install: { ...SETUP.install, on: false },
      copy: { ...SETUP.copy, on: false },
      script: SETUP.script,
    };
    expect(phraseText(setupPhrase(none))).toBe("Worktrees start as a clean checkout");
    expect(phraseText(setupPhrase(none, true))).toBe(
      "Each worktree copies the env files its services read",
    );
  });

  it("adds the env files an environment reads", () => {
    expect(phraseText(setupPhrase(SETUP, true))).toBe(
      "Each worktree runs yarn install and copies .env plus the env files its services read",
    );
  });
});

describe("commandsPhrase", () => {
  it("handles one, many and none", () => {
    expect(phraseText(commandsPhrase(["test"]))).toBe("Quick command test on every card");
    expect(phraseText(commandsPhrase(["dev", "test"]))).toBe(
      "Quick commands dev and test on every card",
    );
    expect(phraseText(commandsPhrase([]))).toBe("No quick commands on the cards");
  });
});
