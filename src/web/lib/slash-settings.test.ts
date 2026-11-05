import { describe, expect, it } from "vite-plus/test";
import { MODELS } from "@/components/composer/models";
import { slashSettings } from "@/lib/slash-settings";

describe("slashSettings", () => {
  it("reads effort and model changes typed as commands", () => {
    expect(slashSettings("/effort low", MODELS)).toEqual({ effort: "low" });
    expect(slashSettings("/model Sonnet", MODELS)).toEqual({ model: "sonnet-5" });
  });

  it("leaves other commands to Claude", () => {
    expect(slashSettings("/effort", MODELS)).toBeNull();
    expect(slashSettings("/clear", MODELS)).toBeNull();
    expect(slashSettings("/model gpt", MODELS)).toBeNull();
  });
});
