import { definePlugin } from "@kiyo/plugin-sdk";
import { makeOpenAICompatProvider } from "./_openai-compat.js";

export default definePlugin({
  kind: "provider",
  name: "mistral",
  description: "Mistral AI.",
  version: "0.1.0",
  author: "Kiyo",
  provider: makeOpenAICompatProvider({
    id: "mistral",
    displayName: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    envVar: "MISTRAL_API_KEY",
    models: [
      { id: "mistral-small-latest", name: "Mistral Small", ctx: 32768, tools: true },
      { id: "codestral-latest", name: "Codestral", ctx: 32768, tools: true },
    ],
    rateLimits: { requestsPerMinute: 60 },
  }),
});
