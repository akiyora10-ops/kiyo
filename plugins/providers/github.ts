import { definePlugin } from "@kiyo/plugin-sdk";
import { makeOpenAICompatProvider } from "./_openai-compat.js";

export default definePlugin({
  kind: "provider",
  name: "github",
  description: "GitHub Models.",
  version: "0.1.0",
  author: "Kiyo",
  provider: makeOpenAICompatProvider({
    id: "github",
    displayName: "GitHub Models",
    baseUrl: "https://models.inference.ai.azure.com",
    envVar: "GITHUB_TOKEN",
    models: [
      { id: "gpt-4o-mini", name: "GPT-4o mini", ctx: 128000, tools: true, vision: true },
      { id: "Meta-Llama-3.1-70B-Instruct", name: "Llama 3.1 70B", ctx: 131072, tools: true },
    ],
    rateLimits: { requestsPerMinute: 15, requestsPerDay: 150 },
  }),
});
