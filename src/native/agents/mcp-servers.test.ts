import { describe, expect, it } from "vite-plus/test";
import { isMcpServerName, mcpAddArgs, splitCommand } from "@native/agents/mcp-servers";

describe("splitCommand", () => {
  it("splits on spaces and keeps quoted words together", () => {
    expect(splitCommand(`npx -y "@scope/server" --root '/a b'  ""`)).toEqual([
      "npx",
      "-y",
      "@scope/server",
      "--root",
      "/a b",
      "",
    ]);
  });
});

describe("mcpAddArgs", () => {
  it("adds a URL as an http server for the project", () => {
    expect(mcpAddArgs({ name: "sentry", target: " https://mcp.sentry.dev/mcp " })).toEqual([
      "mcp",
      "add",
      "--scope",
      "project",
      "--transport",
      "http",
      "sentry",
      "https://mcp.sentry.dev/mcp",
    ]);
  });

  it("passes a command after the separator so its flags stay its own", () => {
    expect(mcpAddArgs({ name: "files", target: "npx -y server --flag" })).toEqual([
      "mcp",
      "add",
      "--scope",
      "project",
      "files",
      "--",
      "npx",
      "-y",
      "server",
      "--flag",
    ]);
  });

  it("rejects names Claude Code cannot store and empty targets", () => {
    expect(isMcpServerName("my server")).toBe(false);
    expect(() => mcpAddArgs({ name: "ok", target: "  " })).toThrow();
  });
});
