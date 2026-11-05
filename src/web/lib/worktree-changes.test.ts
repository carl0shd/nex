import { describe, expect, it } from "vite-plus/test";
import { parseWorktreePatch } from "@/lib/worktree-changes";

const PATCH = [
  "diff --git a/src/a.ts b/src/a.ts",
  "index 1111111..2222222 100644",
  "--- a/src/a.ts",
  "+++ b/src/a.ts",
  "@@ -1,2 +1,3 @@",
  " keep",
  "-old",
  "+new",
  "+more",
  "diff --git a/src/b.ts b/src/b.ts",
  "new file mode 100644",
  "index 0000000..3333333",
  "--- /dev/null",
  "+++ b/src/b.ts",
  "@@ -0,0 +1 @@",
  "+hello",
  "",
].join("\n");

describe("parseWorktreePatch", () => {
  it("lists each file with its status and line counts", () => {
    const files = parseWorktreePatch(PATCH);
    expect(
      files.map(({ path, status, added, removed }) => ({ path, status, added, removed })),
    ).toEqual([
      { path: "src/a.ts", status: "M", added: 2, removed: 1 },
      { path: "src/b.ts", status: "A", added: 1, removed: 0 },
    ]);
  });

  it("gives a file a new version when its content changes", () => {
    const [before] = parseWorktreePatch(PATCH);
    const [after] = parseWorktreePatch(PATCH.replace("+more", "+other"));
    expect(after.version).not.toBe(before.version);
  });

  it("keeps the same object for a file that did not change", () => {
    const before = parseWorktreePatch(PATCH);
    const after = parseWorktreePatch(PATCH.replace("+hello", "+bye"), before);
    expect(after[0]).toBe(before[0]);
    expect(after[1]).not.toBe(before[1]);
  });

  it("returns nothing for an empty patch", () => {
    expect(parseWorktreePatch("")).toEqual([]);
  });
});
