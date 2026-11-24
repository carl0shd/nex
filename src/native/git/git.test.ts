import { describe, expect, it } from "vite-plus/test";
import { parseSubmodules, sameRemote } from "@native/git/git";

describe("submodules", () => {
  it("reads every submodule's path and remote git config lists", () => {
    const listed = [
      "submodule.triton.path triton",
      "submodule.triton.url git@github.com:acme/triton.git",
      "submodule.libs/ui.path packages/ui",
      "submodule.orphan.url https://example.com/orphan",
      "",
    ].join("\n");
    expect(parseSubmodules(listed)).toEqual([
      { name: "triton", path: "triton", url: "git@github.com:acme/triton.git" },
      { name: "libs/ui", path: "packages/ui" },
    ]);
    expect(parseSubmodules("")).toEqual([]);
  });

  it("treats a remote with or without .git as the same one", () => {
    expect(sameRemote("git@github.com:acme/oberon.git")).toBe(
      sameRemote("git@github.com:acme/oberon/"),
    );
  });
});
