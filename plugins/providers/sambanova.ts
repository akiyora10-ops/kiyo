import { definePlugin } from "@kiyo/plugin-sdk";
import { makeOpenAICompatProvider } from "./_openai-compat.js";

export default definePlugin({
  kind: "provider",
  name: "sambanova",
  description: "SambaNova.",
  version: "0.1.0",
  author: "Kiyo",
  provider: makeOpenAICompatProvider({
    id: "sambanova",
    displayName: "SambaNova",
    baseUrl: "https://api.sambanova.ai/v1",
    envVar: "SAMBANOVA_API_KEY",
    models: [{ id: "Meta-Llama-3.3-70B-Instruct", name: "Llama 3.3 70B", ctx: 8192, tools: true }],
    rateLimits: { requestsPerMinute: 20 },
  }),
});
