import { definePlugin } from "@kiyo/plugin-sdk";
import { makeOpenAICompatProvider } from "./_openai-compat.js";

export default definePlugin({
  kind: "provider",
  name: "cerebras",
  description: "Cerebras inference.",
  version: "0.1.0",
  author: "Kiyo",
  provider: makeOpenAICompatProvider({
    id: "cerebras",
    displayName: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    envVar: "CEREBRAS_API_KEY",
    models: [{ id: "llama3.1-8b", name: "Llama 3.1 8B", ctx: 8192, tools: true }],
    rateLimits: { requestsPerMinute: 30 },
  }),
});
