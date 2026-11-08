import { describe, it, expect, vi } from "vitest";
import { makeOpenAICompatProvider } from "../plugins/providers/_openai-compat.js";

describe("openai-compat", () => {
  it("streams text and tool calls", async () => {
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(enc.encode('data: {"choices":[{"delta":{"content":"hi"}}]}\n\n'));
        controller.enqueue(enc.encode('data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"t1","function":{"name":"read","arguments":"{\\"path\\":\\"a\\"}"}}]}}]}\n\n'));
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    (globalThis as any).fetch = vi.fn(async () => new Response(stream, { status: 200 }));
    const p = makeOpenAICompatProvider({
      id: "x",
      displayName: "X",
      baseUrl: "http://x/v1",
      envVar: "X",
      auth: "none",
      models: [{ id: "m", name: "m", ctx: 1000, tools: true }],
    });
    const out: any[] = [];
    for await (const c of p.chat({ model: "m", messages: [], stream: true })) out.push(c);
    expect(out.find((c) => c.type === "text")?.text).toBe("hi");
    const tc = out.find((c) => c.type === "tool_call");
    expect(tc?.toolCall?.name).toBe("read");
    expect(tc?.toolCall?.arguments).toEqual({ path: "a" });
  });
});
