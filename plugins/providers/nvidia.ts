import { definePlugin } from "@kiyo/plugin-sdk";
import { makeOpenAICompatProvider } from "./_openai-compat.js";

export default definePlugin({
  kind: "provider",
  name: "nvidia",
  description: "NVIDIA NIM.",
  version: "0.1.0",
  author: "Kiyo",
  provider: makeOpenAICompatProvider({
    id: "nvidia",
    displayName: "NVIDIA NIM",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    envVar: "NVIDIA_API_KEY",
    models: [
      { id: "meta/llama-3.3-70b-instruct", name: "Llama 3.3 70B", ctx: 131072, tools: true },
    ],
    rateLimits: { requestsPerMinute: 40 },
  }),
});
