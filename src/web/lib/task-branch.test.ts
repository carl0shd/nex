import { describe, expect, it } from "vite-plus/test";
import { taskBranchName, uniqueSlug, withBranchPrefix } from "@/lib/task-branch";

describe("taskBranchName", () => {
  it.each([
    ["Fix login redirect param", "feat/fix-login-redirect"],
    ["Rename users to accounts", "feat/rename-users-accounts"],
    ["Añadir página de precios", "feat/anadir-pagina-de"],
    ["  Bump Electron to 39.2! ", "feat/bump-electron-39"],
    ["", "feat/new-task"],
  ])("%j → %s", (title, branch) => expect(taskBranchName(title)).toBe(branch));
});

describe("withBranchPrefix", () => {
  it("drops trailing slashes and skips an empty prefix", () => {
    expect(withBranchPrefix("fix-login", "feat/")).toBe("feat/fix-login");
    expect(withBranchPrefix("fix-login", "")).toBe("fix-login");
  });
});

describe("uniqueSlug", () => {
  it("adds the first free number", () => {
    expect(uniqueSlug("fix-login", new Set())).toBe("fix-login");
    expect(uniqueSlug("fix-login", new Set(["fix-login", "fix-login-2"]))).toBe("fix-login-3");
  });
});
