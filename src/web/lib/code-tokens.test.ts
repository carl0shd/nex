import { describe, expect, it } from "vite-plus/test";
import { codeTokens } from "@/lib/code-tokens";

describe("codeTokens", () => {
  it("marks keywords, strings, numbers and comments", () => {
    const [line] = codeTokens('const a = "x" + 42; // done', "ts");
    expect(line).toEqual([
      { text: "const", kind: "keyword" },
      { text: " a = ", kind: undefined },
      { text: '"x"', kind: "string" },
      { text: " + ", kind: undefined },
      { text: "42", kind: "number" },
      { text: "; ", kind: undefined },
      { text: "// done", kind: "comment" },
    ]);
  });

  it("uses # comments for shell and keeps block comments across lines", () => {
    expect(codeTokens("echo hi # note", "bash")[0].at(-1)).toEqual({
      text: "# note",
      kind: "comment",
    });
    const lines = codeTokens("/* one\ntwo */ x", "js");
    expect(lines[1][0]).toEqual({ text: "two */", kind: "comment" });
  });

  it("treats html comments as comments across lines", () => {
    const lines = codeTokens("<!-- one with\ntwo for -->", "html");
    expect(lines.every((line) => line.every((token) => token.kind === "comment"))).toBe(true);
  });

  it("leaves plain text alone", () => {
    expect(codeTokens("if 1", "")).toEqual([[{ text: "if 1" }]]);
  });
});
