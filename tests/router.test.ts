import { describe, it, expect } from "vitest";
import { createRouter } from "../packages/router/src/index.js";
import type { Provider } from "@kiyo/plugin-sdk";

function mkProvider(id: string, chat: Provider["chat"]): Provider {
  return {
    id,
    displayName: id,
    baseUrl: "http://localhost",
    authMethod: "none",
    envVar: "",
    models: [{ id: "m", displayName: "m", contextWindow: 1000, capabilities: { tools: true, vision: false, longContext: false, streaming: true } }],
    rateLimits: {},
    healthCheck: async () => true,
    chat,
  };
}

describe("router", () => {
  it("selects first available with model", () => {
    const r = createRouter({ providers: [mkProvider("a", async function* () {}), mkProvider("b", async function* () {})], mode: "free-first" });
    const sel = r.select({ tools: true });
    expect(sel?.provider.id).toBe("a");
    expect(sel?.model).toBe("m");
  });

  it("skips cooled-down provider", () => {
    const r = createRouter({ providers: [mkProvider("a", async function* () {}), mkProvider("b", async function* () {})], mode: "free-first" });
    r.markRateLimited("a", 60_000);
    expect(r.select({ tools: true })?.provider.id).toBe("b");
  });

  it("parses retry-after seconds", () => {
    const r = createRouter({ providers: [], mode: "free-first" });
    expect(r.parseRetryAfter({ "Retry-After": "5" })).toBe(5000);
  });
});
