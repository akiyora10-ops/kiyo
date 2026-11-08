import { definePlugin } from "@kiyo/plugin-sdk";
import { z } from "zod";

export default definePlugin({
  kind: "tool",
  name: "web-fetch",
  description: "Fetch a URL and return text content.",
  version: "0.1.0",
  author: "Kiyo",
  tool: {
    name: "web-fetch",
    description: "Fetch a URL and return text content.",
    inputSchema: z.object({ url: z.string() }),
    permission: "network",
    async run(input) {
      const res = await fetch((input as any).url);
      const text = await res.text();
      return text.length > 30000 ? `${text.slice(0, 30000)}\n...[truncated]` : text;
    },
  },
});
