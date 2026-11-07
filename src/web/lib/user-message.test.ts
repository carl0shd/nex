import { describe, expect, it } from "vite-plus/test";
import {
  imageMarker,
  parseUserMessage,
  pastedBlock,
  withoutImageMarkers,
} from "@/lib/user-message";

const longText = Array.from({ length: 30 }, (_, index) => `line ${index}`).join("\n");

describe("parseUserMessage", () => {
  it("turns mentions and links into pills", () => {
    expect(
      parseUserMessage("Fix @src/auth/url.ts, see https://github.com/acme/app/pull/12").parts,
    ).toEqual([
      { kind: "text", text: "Fix " },
      { kind: "file", path: "src/auth/url.ts" },
      { kind: "text", text: ", see " },
      { kind: "link", url: "https://github.com/acme/app/pull/12" },
    ]);
  });

  it("leaves handles and emails as text", () => {
    expect(parseUserMessage("ask @carlos or mail a@b.co").parts).toEqual([
      { kind: "text", text: "ask @carlos or mail a@b.co" },
    ]);
  });

  it("keeps an attached path with spaces whole", () => {
    expect(parseUserMessage("Read this\n\n@/Users/me/My Files/spec.pdf").parts).toEqual([
      { kind: "text", text: "Read this\n\n" },
      { kind: "file", path: "/Users/me/My Files/spec.pdf" },
    ]);
  });

  it("pulls long pasted text out as a card", () => {
    const message = parseUserMessage(`Look at this\n\n${pastedBlock(longText)}`);
    expect(message.parts).toEqual([{ kind: "text", text: "Look at this" }]);
    expect(message.pasted).toEqual([{ content: longText, lines: 30 }]);
  });

  it("survives pasted text that has its own fences", () => {
    const content = `${longText}\n\`\`\`\ncode\n\`\`\``;
    expect(parseUserMessage(pastedBlock(content)).pasted[0]?.content).toBe(content);
  });

  it("keeps a short code fence in the message", () => {
    expect(parseUserMessage("```\nnpm test\n```").pasted).toEqual([]);
  });

  it("reads the names of attached images", () => {
    const text = ["Match this", imageMarker(2, "mock.png")].join("\n\n");
    const message = parseUserMessage(text);
    expect(message.parts).toEqual([{ kind: "text", text: "Match this" }]);
    expect(message.imageNames).toEqual([undefined, "mock.png"]);
    expect(withoutImageMarkers(text)).toBe("Match this");
  });
});

describe("imageMarker", () => {
  it("skips the generic name of a pasted screenshot", () => {
    expect(imageMarker(1, "image.png")).toBeNull();
    expect(imageMarker(1, "login.png")).toBe("[Image 1: login.png]");
  });
});
