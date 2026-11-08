import type { Provider } from "@kiyo/plugin-sdk";
import { describe, expect, it } from "vitest";
import { createRouter } from "../packages/router/src/index.js";

function mkProvider(id: string, impl: (req: any) => AsyncIterable<any>): Provider {
  return {
    id,
    displayName: id,
    baseUrl: "http://localhost",
    authMethod: "none",
    envVar: "",
    models: [
      {
        id: "m",
        displayName: "m",
        contextWindow: 1000,
        capabilities: { tools: true, vision: false, longContext: false, streaming: true },
      },
    ],
    rateLimits: {},
    healthCheck: async () => true,
    chat: (req) => impl(req),
  };
}

describe("router fallback", () => {
  it("switches on 429 and completes", async () => {
    const p1 = mkProvider("a", async function* () {
      yield { type: "error", error: "429 rate limited" };
    });
    const p2 = mkProvider("b", async function* () {
      yield { type: "text", text: "done" };
      yield { type: "done" };
    });
    const r = createRouter({ providers: [p1, p2], mode: "free-first" });
    const chunks: any[] = [];
    for await (const c of r.chatWithFallback({ model: "", messages: [], stream: true })) {
      chunks.push(c);
    }
    const text = chunks
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("");
    expect(text).toBe("done");
    expect(chunks.some((c) => c.type === "provider_switch")).toBe(true);
  });
});
