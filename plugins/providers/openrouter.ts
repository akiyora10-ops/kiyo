import { definePlugin } from "@kiyo/plugin-sdk";
import { makeOpenAICompatProvider } from "./_openai-compat.js";

// TODO(verify): confirm free model IDs and rate limits against https://openrouter.ai/docs
export default definePlugin({
  kind: "provider",
  name: "openrouter",
  description: "OpenRouter free models router.",
  version: "0.1.0",
  author: "Kiyo",
  provider: makeOpenAICompatProvider({
    id: "openrouter",
    displayName: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    envVar: "OPENROUTER_API_KEY",
    models: [
      {
        id: "meta-llama/llama-3.3-70b-instruct:free",
        name: "Llama 3.3 70B (free)",
        ctx: 131072,
        tools: true,
      },
      { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (free)", ctx: 65536, tools: false },
      { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (free)", ctx: 96000, tools: true },
    ],
    rateLimits: { requestsPerMinute: 20, requestsPerDay: 200 },
  }),
});
