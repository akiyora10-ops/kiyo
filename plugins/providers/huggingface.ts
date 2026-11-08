import { definePlugin } from "@kiyo/plugin-sdk";
import { makeOpenAICompatProvider } from "./_openai-compat.js";

// TODO(verify): HF inference router endpoint and model IDs
export default definePlugin({
  kind: "provider",
  name: "huggingface",
  description: "Hugging Face Inference.",
  version: "0.1.0",
  author: "Kiyo",
  provider: makeOpenAICompatProvider({
    id: "huggingface",
    displayName: "Hugging Face",
    baseUrl: "https://api-inference.huggingface.co/v1",
    envVar: "HF_TOKEN",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct", name: "Llama 3.3 70B", ctx: 8192, tools: false },
    ],
    rateLimits: { requestsPerMinute: 10 },
  }),
});
