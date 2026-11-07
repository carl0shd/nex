import { describe, expect, it } from "vite-plus/test";
import { badgeFields, storedWorkspaceIcon, workspaceIcon } from "@/lib/workspace-icons";

describe("workspaceIcon", () => {
  it("reads an icon stored with its prefix", () => {
    expect(workspaceIcon(storedWorkspaceIcon("rocket"))).toBe("rocket");
  });

  it("ignores letters, images and icons outside the set", () => {
    expect(workspaceIcon("letter")).toBeUndefined();
    expect(workspaceIcon("image")).toBeUndefined();
    expect(workspaceIcon("icon:toString")).toBeUndefined();
    expect(workspaceIcon(null)).toBeUndefined();
  });
});

describe("badgeFields", () => {
  it("leaves the badge alone when nothing about it changed", () => {
    expect(badgeFields(undefined, undefined)).toEqual({});
  });

  it("drops the image when an icon is picked", () => {
    expect(badgeFields(undefined, "leaf")).toEqual({ icon: "icon:leaf", customImage: null });
  });

  it("stores an image or falls back to the initial", () => {
    expect(badgeFields("/badges/w.png", null)).toEqual({
      icon: "image",
      customImage: "/badges/w.png",
    });
    expect(badgeFields(null, null)).toEqual({ icon: "letter", customImage: null });
  });
});
