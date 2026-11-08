import { definePlugin } from "@kiyo/plugin-sdk";
import { makeOpenAICompatProvider } from "./_openai-compat.js";

// TODO(verify): confirm model IDs against https://console.groq.com/docs/models
export default definePlugin({
  kind: "provider",
  name: "groq",
  description: "Groq fast inference.",
  version: "0.1.0",
  author: "Kiyo",
  provider: makeOpenAICompatProvider({
    id: "groq",
    displayName: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    envVar: "GROQ_API_KEY",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", ctx: 131072, tools: true },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", ctx: 131072, tools: true },
    ],
    rateLimits: { requestsPerMinute: 30, requestsPerDay: 14400 },
  }),
});
