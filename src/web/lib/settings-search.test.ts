import { describe, expect, it } from "vite-plus/test";
import { filterSections } from "@/lib/settings-search";

const SECTIONS = [
  {
    title: "General",
    groups: [
      {
        blocks: [
          { keywords: ["Open at login", "Start Nex when you sign in"] },
          { keywords: ["Open in IDE", "Cursor"] },
        ],
      },
    ],
  },
  {
    title: "Terminal",
    groups: [{ blocks: [{ keywords: ["Shell", "Login shell for new terminals"] }] }],
  },
];

describe("filterSections", () => {
  it("returns everything for an empty query", () => {
    expect(filterSections(SECTIONS, " ")).toHaveLength(2);
  });

  it("keeps only the matching rows, case-insensitively", () => {
    const result = filterSections(SECTIONS, "ide");
    expect(result).toHaveLength(1);
    expect(result[0].groups[0].blocks).toEqual([{ keywords: ["Open in IDE", "Cursor"] }]);
  });

  it("matches descriptions and keeps a whole section when its title matches", () => {
    expect(filterSections(SECTIONS, "login shell")[0].title).toBe("Terminal");
    expect(filterSections(SECTIONS, "general")[0].groups[0].blocks).toHaveLength(2);
  });

  it("drops sections with nothing left", () => {
    expect(filterSections(SECTIONS, "zzz")).toEqual([]);
  });
});
