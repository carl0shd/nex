import { describe, expect, it } from "vite-plus/test";
import { toAgentModels } from "@native/agents/agent-models";

const RAW = [
  {
    value: "default",
    resolvedModel: "claude-opus-5-5[1m]",
    displayName: "Default (recommended)",
    description: "Opus 5.5 with 1M context · Best for everyday, complex tasks",
    supportsEffort: true,
    supportedEffortLevels: ["low", "medium", "high", "xhigh", "max"],
    supportsAutoMode: true,
  },
  {
    value: "opus[1m]",
    resolvedModel: "claude-opus-5-5[1m]",
    displayName: "Opus (1M context)",
    description: "Opus 5.5 with 1M context · Best for everyday, complex tasks",
    supportsEffort: true,
    supportedEffortLevels: ["low", "medium", "high", "xhigh", "max"],
    supportsAutoMode: true,
  },
  {
    value: "haiku",
    resolvedModel: "claude-haiku-4-5",
    displayName: "Haiku",
    description: "Haiku 4.5 · Fastest for quick answers",
    supportsEffort: null,
    supportsAutoMode: null,
  },
];

describe("toAgentModels", () => {
  it("drops the default alias when another entry is the same model", () => {
    expect(toAgentModels(RAW).map((model) => model.value)).toEqual(["opus[1m]", "haiku"]);
  });

  it("names models by their version", () => {
    expect(toAgentModels(RAW)[0]).toEqual({
      value: "opus[1m]",
      name: "Opus 5.5",
      summary: "Best for everyday, complex tasks",
      efforts: ["low", "medium", "high", "xhigh", "max"],
      autoMode: true,
    });
  });

  it("keeps one entry per model name", () => {
    const plain = { ...RAW[1], value: "opus", description: "Opus 5.5 · Best for everyday tasks" };
    expect(toAgentModels([...RAW, plain]).map((model) => model.value)).toEqual([
      "opus[1m]",
      "haiku",
    ]);
  });

  it("reads what a model cannot do", () => {
    expect(toAgentModels(RAW)[1]).toMatchObject({
      name: "Haiku 4.5",
      efforts: [],
      autoMode: false,
    });
  });

  it("ignores anything that is not a list", () => {
    expect(toAgentModels(undefined)).toEqual([]);
  });
});
