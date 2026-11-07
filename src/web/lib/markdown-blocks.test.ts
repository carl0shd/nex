import { describe, expect, it } from "vite-plus/test";
import { calloutLabel, fenceInfo } from "@/lib/markdown-blocks";

describe("fenceInfo", () => {
  it("reads a bare language", () => {
    expect(fenceInfo("ts")).toEqual({ language: "ts", file: "" });
    expect(fenceInfo("")).toEqual({ language: "text", file: "" });
  });

  it("reads the file after the language", () => {
    expect(fenceInfo("ts src/auth/url.ts")).toEqual({ language: "ts", file: "src/auth/url.ts" });
    expect(fenceInfo("tsx:src/app.tsx")).toEqual({ language: "tsx", file: "src/app.tsx" });
  });

  it("reads a title attribute", () => {
    expect(fenceInfo('ts title="src/auth/url.ts"')).toEqual({
      language: "ts",
      file: "src/auth/url.ts",
    });
    expect(fenceInfo("filename=main.go")).toEqual({ language: "go", file: "main.go" });
  });

  it("takes the language from a lone file name", () => {
    expect(fenceInfo("src/auth/url.ts")).toEqual({ language: "ts", file: "src/auth/url.ts" });
  });

  it("ignores extra words that are not files", () => {
    expect(fenceInfo("bash copy")).toEqual({ language: "bash", file: "" });
  });
});

describe("calloutLabel", () => {
  it("accepts a short bold label that ends like one", () => {
    expect(calloutLabel("Heads up.", " The callback")).toEqual({
      title: "Heads up.",
      rest: "The callback",
    });
    expect(calloutLabel("Warning:", " careful")).toEqual({ title: "Warning:", rest: "careful" });
  });

  it("moves a colon after the label into it", () => {
    expect(calloutLabel("Note", ": it runs twice")).toEqual({
      title: "Note:",
      rest: "it runs twice",
    });
  });

  it("leaves an ordinary bold opening alone", () => {
    expect(calloutLabel("Important", " detail")).toBeNull();
    expect(calloutLabel("This whole sentence is bold.", "")).toBeNull();
  });
});
