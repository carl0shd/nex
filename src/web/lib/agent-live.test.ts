import { describe, expect, it } from "vite-plus/test";
import {
  EMPTY_LIVE,
  applyLiveEvent,
  mergeEntries,
  partialField,
  turnTokens,
} from "@/lib/agent-live";

const stream = (event: object) => ({ type: "stream_event", event });

describe("applyLiveEvent", () => {
  it("builds the text Claude is writing from its deltas", () => {
    let state = EMPTY_LIVE;
    for (const event of [
      stream({ type: "message_start" }),
      stream({ type: "content_block_start", index: 1, content_block: { type: "text" } }),
      stream({
        type: "content_block_delta",
        index: 1,
        delta: { type: "text_delta", text: "Hola, q" },
      }),
      stream({
        type: "content_block_delta",
        index: 1,
        delta: { type: "text_delta", text: "ué tal" },
      }),
    ]) {
      state = applyLiveEvent(state, event);
    }
    expect(state.blocks).toEqual([{ kind: "text", index: 1, text: "Hola, qué tal" }]);
    state = applyLiveEvent(state, stream({ type: "content_block_stop", index: 1 }));
    expect(state.blocks).toEqual([]);
  });

  it("keeps finished messages with the transcript's field names", () => {
    const state = applyLiveEvent(EMPTY_LIVE, {
      type: "user",
      uuid: "u1",
      tool_use_result: { stdout: "ok" },
    });
    expect(state.entries[0]).toMatchObject({ uuid: "u1", toolUseResult: { stdout: "ok" } });
  });

  it("drops the live block as soon as the finished message arrives", () => {
    let state = applyLiveEvent(
      EMPTY_LIVE,
      stream({ type: "content_block_start", index: 0, content_block: { type: "text" } }),
    );
    state = applyLiveEvent(state, {
      type: "assistant",
      uuid: "a1",
      message: { content: [{ type: "text", text: "Hola" }] },
    });
    expect(state.blocks).toEqual([]);
    expect(state.entries).toHaveLength(1);
  });

  it("ignores what subagents stream", () => {
    const state = applyLiveEvent(EMPTY_LIVE, { type: "assistant", parent_tool_use_id: "t1" });
    expect(state).toBe(EMPTY_LIVE);
  });
});

describe("turnTokens", () => {
  it("estimates while streaming and adds up every message of the turn", () => {
    let state = EMPTY_LIVE;
    for (const event of [
      stream({ type: "message_start" }),
      { type: "system", subtype: "thinking_tokens", estimated_tokens: 200 },
      stream({
        type: "content_block_delta",
        index: 1,
        delta: { type: "text_delta", text: "x".repeat(40) },
      }),
    ]) {
      state = applyLiveEvent(state, event);
    }
    expect(turnTokens(state)).toBe(210);
    state = applyLiveEvent(state, stream({ type: "message_delta", usage: { output_tokens: 385 } }));
    state = applyLiveEvent(state, stream({ type: "message_stop" }));
    state = applyLiveEvent(state, stream({ type: "message_start" }));
    expect(turnTokens(state)).toBe(385);
    state = applyLiveEvent(state, { type: "result" });
    expect(turnTokens(state)).toBe(0);
  });
});

describe("mergeEntries", () => {
  it("adds live messages the transcript has not written yet", () => {
    const merged = mergeEntries([{ uuid: "a" }], [{ uuid: "a" }, { uuid: "b" }]);
    expect(merged).toEqual([{ uuid: "a" }, { uuid: "b" }]);
  });
});

describe("partialField", () => {
  it("reads a field from JSON that is still arriving", () => {
    expect(partialField('{"command": "yarn te', "command")).toBe("yarn te");
    expect(partialField('{"file_path": "/a/b.ts", "old', "file_path")).toBe("/a/b.ts");
  });
});
