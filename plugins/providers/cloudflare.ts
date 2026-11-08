import { definePlugin } from "@kiyo/plugin-sdk";
import { makeOpenAICompatProvider } from "./_openai-compat.js";

export default definePlugin({
  kind: "provider",
  name: "cloudflare",
  description: "Cloudflare Workers AI.",
  version: "0.1.0",
  author: "kiyo",
  provider: makeOpenAICompatProvider({
    id: "cloudflare",
    displayName: "Cloudflare Workers AI",
    baseUrl: `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID || "ACCOUNT_ID"}/ai/v1`,
    envVar: "CF_API_TOKEN",
    models: [
      {
        id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        name: "Llama 3.3 70B",
        ctx: 24000,
        tools: true,
      },
    ],
    rateLimits: { requestsPerMinute: 50 },
  }),
});
