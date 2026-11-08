import { definePlugin } from "@kiyo/plugin-sdk";
import { z } from "zod";

export default definePlugin({
  kind: "tool",
  name: "ask-user",
  description: "Ask the user a clarifying question.",
  version: "0.1.0",
  author: "kiyo",
  tool: {
    name: "ask-user",
    description: "Ask the user a clarifying question.",
    inputSchema: z.object({ question: z.string() }),
    permission: "read",
    async run(input) {
      return `QUESTION: ${(input as any).question}`;
    },
  },
});
