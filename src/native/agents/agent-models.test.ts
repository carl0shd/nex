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

  it("reads the name from displayName when the description is only a summary", () => {
    const [model] = toAgentModels([
      {
        value: "opus",
        displayName: "Opus 5.5",
        description: "For complex work and everyday tasks",
        supportsEffort: true,
        supportedEffortLevels: ["low", "high"],
      },
    ]);
    expect(model).toMatchObject({
      name: "Opus 5.5",
      summary: "For complex work and everyday tasks",
    });
  });

  it("reads Claude Code's current list: default folded into its model, names from displayName", () => {
    const raw = [
      {
        value: "default",
        displayName: "Default (recommended)",
        description: "Opus 5.5 · Best for everyday, complex tasks",
        resolvedModel: "claude-opus-5-5",
      },
      {
        value: "opus",
        displayName: "Opus 5.5",
        description: "For complex work and everyday tasks",
        resolvedModel: "claude-opus-5-5",
      },
      {
        value: "fable",
        displayName: "Fable 5.2",
        description: "For your toughest challenges",
        resolvedModel: "claude-fable-5-2",
      },
      {
        value: "claude-fable-5-1",
        displayName: "Fable 5.1",
        description: "Most capable for your hardest and longest-running tasks",
        resolvedModel: "claude-fable-5-1",
      },
    ];
    expect(
      toAgentModels(raw).map(({ value, name, summary }) => ({ value, name, summary })),
    ).toEqual([
      { value: "opus", name: "Opus 5.5", summary: "For complex work and everyday tasks" },
      { value: "fable", name: "Fable 5.2", summary: "For your toughest challenges" },
      {
        value: "claude-fable-5-1",
        name: "Fable 5.1",
        summary: "Most capable for your hardest and longest-running tasks",
      },
    ]);
  });
});
