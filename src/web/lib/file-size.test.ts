import { describe, expect, it } from "vite-plus/test";
import { formatFileSize } from "@/lib/file-size";

describe("formatFileSize", () => {
  it.each([
    [512, "512 B"],
    [2048, "2 KB"],
    [1536, "1.5 KB"],
    [15 * 1024 * 1024, "15 MB"],
  ])("%i → %s", (bytes, label) => expect(formatFileSize(bytes)).toBe(label));
});
