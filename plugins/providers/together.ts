import { definePlugin } from "@kiyo/plugin-sdk";
import { makeOpenAICompatProvider } from "./_openai-compat.js";

export default definePlugin({
  kind: "provider",
  name: "together",
  description: "Together AI.",
  version: "0.1.0",
  author: "Kiyo",
  provider: makeOpenAICompatProvider({
    id: "together",
    displayName: "Together",
    baseUrl: "https://api.together.xyz/v1",
    envVar: "TOGETHER_API_KEY",
    models: [
      {
        id: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        name: "Llama 3.3 70B Turbo",
        ctx: 131072,
        tools: true,
      },
    ],
    rateLimits: { requestsPerMinute: 60 },
  }),
});
