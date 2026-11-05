import { describe, expect, it } from "vite-plus/test";
import { connectorGroups, connectorName } from "@/lib/connectors";

describe("connectorGroups", () => {
  it("groups servers by where they come from and reads their state", () => {
    const groups = connectorGroups([
      { name: "pencil", status: "connected", source: "user", tools: 9, error: null },
      {
        name: "plugin:cloudflare:cloudflare",
        status: "needs-auth",
        source: "plugin",
        tools: 0,
        error: null,
      },
      { name: "freecad", status: "failed", source: "user", tools: 0, error: "Connection closed" },
    ]);
    expect(groups.map((group) => group.label)).toEqual(["Yours", "Plugins"]);
    expect(groups[0].connectors).toMatchObject([
      { name: "Pencil", detail: "9 tools", enabled: true, failed: false },
      { name: "Freecad", detail: "Connection closed", failed: true },
    ]);
    expect(groups[1].connectors[0]).toMatchObject({ name: "Cloudflare", detail: "Needs sign-in" });
  });

  it("cleans up claude.ai names", () => {
    expect(connectorName("claude.ai Linear")).toBe("Linear");
  });
});
