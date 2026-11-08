import { definePlugin } from "@kiyo/plugin-sdk";
import { makeOpenAICompatProvider } from "./_openai-compat.js";

export default definePlugin({
  kind: "provider",
  name: "ollama",
  description: "Local Ollama instance.",
  version: "0.1.0",
  author: "Kiyo",
  provider: makeOpenAICompatProvider({
    id: "ollama",
    displayName: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    envVar: "OLLAMA_HOST",
    models: [{ id: "llama3.2", name: "Llama 3.2", ctx: 131072, tools: true }],
    rateLimits: {},
  }),
});
