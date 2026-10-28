import { describe, expect, it } from "vite-plus/test";
import { taskBranchName } from "@/lib/task-branch";

describe("taskBranchName", () => {
  it.each([
    ["Fix login redirect param", "feat/fix-login-redirect"],
    ["Rename users to accounts", "feat/rename-users-accounts"],
    ["Añadir página de precios", "feat/anadir-pagina-de"],
    ["  Bump Electron to 39.2! ", "feat/bump-electron-39"],
    ["", "feat/new-task"],
  ])("%j → %s", (title, branch) => expect(taskBranchName(title)).toBe(branch));
});
