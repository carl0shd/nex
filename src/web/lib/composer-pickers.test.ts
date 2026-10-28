import { describe, expect, it } from "vite-plus/test";
import {
  commandPickerView,
  filePickerEntries,
  filePickerView,
  toEntry,
  type SlashCommand,
  type WorktreeFile,
} from "@/lib/composer-pickers";

const FILES: WorktreeFile[] = [
  { path: "src/routes/logout.tsx", status: "M" },
  { path: "src/auth/url.ts", status: "M" },
  { path: "src/auth/session.test.ts", status: "A" },
  { path: "src/routes/login.tsx", recent: true },
  { path: "src/auth/", recent: true },
  { path: "src/auth/session.ts" },
  { path: "src/auth/providers/github.ts" },
  { path: "src/lib/logger.ts" },
  { path: "docs/changelog.md" },
  { path: "package.json", recent: true },
];

describe("toEntry", () => {
  it("splits name and folder", () => {
    expect(toEntry("src/routes/logout.tsx")).toMatchObject({
      name: "logout.tsx",
      dir: "src/routes",
    });
    expect(toEntry("package.json")).toMatchObject({ name: "package.json", dir: "." });
    expect(toEntry("src/auth/")).toMatchObject({ name: "auth", dir: "src", folder: true });
  });
});

describe("filePickerView", () => {
  it("suggests what the task changed, then recent files", () => {
    const view = filePickerView(FILES, "");
    expect(view.mode).toBe("suggested");
    expect(filePickerEntries(view).map((entry) => entry.name)).toEqual([
      "logout.tsx",
      "url.ts",
      "session.test.ts",
      "login.tsx",
      "auth",
      "package.json",
    ]);
  });

  it("ranks name prefixes first, then what the task touched", () => {
    const view = filePickerView(FILES, "log");
    expect(filePickerEntries(view).map((entry) => entry.name)).toEqual([
      "logout.tsx",
      "login.tsx",
      "logger.ts",
      "changelog.md",
    ]);
  });

  it("lists a folder's children, files before subfolders", () => {
    const view = filePickerView(FILES, "src/auth/");
    expect(view.mode).toBe("folder");
    expect(filePickerEntries(view).map((entry) => entry.name)).toEqual([
      "url.ts",
      "session.test.ts",
      "session.ts",
      "providers",
    ]);
  });
});

describe("commandPickerView", () => {
  const commands: SlashCommand[] = [
    { name: "review", description: "", source: "project" },
    { name: "release-notes", description: "", source: "project" },
    { name: "standup", description: "", source: "personal" },
    { name: "compact", description: "", source: "builtin" },
    { name: "frontend-design", description: "", source: "skill" },
  ];

  it("groups by source and leaves skills for search", () => {
    const view = commandPickerView(commands, "");
    expect(view.mode === "suggested" && view.groups.map((group) => group.source)).toEqual([
      "project",
      "personal",
      "builtin",
    ]);
  });

  it("matches prefixes, then substrings, then loose letters", () => {
    const view = commandPickerView(commands, "re");
    expect(view.mode === "search" && view.matches.map((command) => command.name)).toEqual([
      "review",
      "release-notes",
      "frontend-design",
    ]);
  });
});
