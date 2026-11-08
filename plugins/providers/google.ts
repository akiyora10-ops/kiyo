import { definePlugin } from "@kiyo/plugin-sdk";
import { makeOpenAICompatProvider } from "./_openai-compat.js";

// TODO(verify): confirm model IDs against https://ai.google.dev/gemini-api/docs
export default definePlugin({
  kind: "provider",
  name: "google",
  description: "Google AI Studio (Gemini).",
  version: "0.1.0",
  author: "Kiyo",
  provider: makeOpenAICompatProvider({
    id: "google",
    displayName: "Google AI Studio",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    envVar: "GOOGLE_API_KEY",
    models: [
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        ctx: 1048576,
        tools: true,
        vision: true,
        longContext: true,
      },
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        ctx: 1048576,
        tools: true,
        vision: true,
        longContext: true,
      },
    ],
    rateLimits: { requestsPerMinute: 15, requestsPerDay: 1500 },
  }),
});
