import { promises as fs } from "node:fs";
import { definePlugin } from "@kiyo/plugin-sdk";
import { z } from "zod";

export default definePlugin({
  kind: "tool",
  name: "read",
  description: "Read a file from the filesystem.",
  version: "0.1.0",
  author: "Kiyo",
  tool: {
    name: "read",
    description: "Read a file from the filesystem.",
    inputSchema: z.object({ path: z.string() }),
    permission: "read",
    async run(input, ctx) {
      const p = (input as any).path;
      const full = p.startsWith("/") || /^[A-Za-z]:/.test(p) ? p : `${ctx.projectRoot}/${p}`;
      const content = await fs.readFile(full, "utf8");
      return content.length > 20000 ? `${content.slice(0, 20000)}\n...[truncated]` : content;
    },
  },
});
