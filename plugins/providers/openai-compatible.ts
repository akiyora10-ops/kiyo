import { definePlugin } from "@kiyo/plugin-sdk";
import { makeOpenAICompatProvider } from "./_openai-compat.js";

export default definePlugin({
  kind: "provider",
  name: "openai-compatible",
  description: "Any OpenAI-compatible endpoint.",
  version: "0.1.0",
  author: "Kiyo",
  provider: makeOpenAICompatProvider({
    id: "openai-compatible",
    displayName: "OpenAI-compatible",
    baseUrl: process.env.OPENAI_BASE_URL || "http://localhost:8000/v1",
    envVar: "OPENAI_API_KEY",
    models: [
      {
        id: process.env.OPENAI_MODEL || "gpt-4o-mini",
        name: "Default model",
        ctx: 128000,
        tools: true,
      },
    ],
    rateLimits: {},
  }),
});
