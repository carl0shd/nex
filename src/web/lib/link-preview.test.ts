import { describe, expect, it } from "vite-plus/test";
import { describeLink, splitLinks } from "@/lib/link-preview";

describe("describeLink", () => {
  it.each([
    ["https://linear.app/monoku/issue/NEX-123/fix-redirect-after-login", "linear", "NEX-123"],
    ["https://github.com/monoku/nex/pull/128", "github", "nex#128"],
    ["https://github.com/monoku/nex/issues/42", "github", "nex#42"],
    ["https://github.com/monoku/nex/blob/main/src/auth/url.ts", "github", "url.ts"],
    ["https://www.figma.com/design/k3J9/Nex-2?node-id=12-4", "figma", "Nex 2"],
    ["https://acme.slack.com/archives/C04/p17", "slack", "acme · thread"],
    [
      "https://www.notion.so/monoku/Auth-redesign-8f2c0d1e2f3a4b5c6d7e8f9a0b1c2d3e",
      "notion",
      "Auth redesign",
    ],
    ["https://monoku.atlassian.net/browse/AUTH-77", "jira", "AUTH-77"],
    ["https://monoku.sentry.io/issues/4821/", "sentry", "Sentry #4821"],
    ["https://owasp.org/www-community/attacks/", "web", "owasp.org"],
  ])("%s", (url, service, label) => {
    expect(describeLink(url)).toMatchObject({ service, label });
  });

  it("ignores text that is not a web link", () => {
    expect(describeLink("just words")).toBeNull();
    expect(describeLink("mailto:hi@nex.dev")).toBeNull();
  });
});

describe("splitLinks", () => {
  it("pulls links out of surrounding text and leaves trailing punctuation as text", () => {
    expect(
      splitLinks("please check https://linear.app/meridianai/issue/MER-8967/fe-reload, thanks"),
    ).toEqual([
      { kind: "text", text: "please check " },
      { kind: "link", url: "https://linear.app/meridianai/issue/MER-8967/fe-reload" },
      { kind: "text", text: ", thanks" },
    ]);
  });

  it("returns the text alone when there is no link", () => {
    expect(splitLinks("no links here")).toEqual([{ kind: "text", text: "no links here" }]);
  });
});
