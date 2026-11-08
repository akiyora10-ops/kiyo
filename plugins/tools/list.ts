import { promises as fs } from "node:fs";
import { definePlugin } from "@kiyo/plugin-sdk";
import { z } from "zod";

export default definePlugin({
  kind: "tool",
  name: "list",
  description: "List directory contents.",
  version: "0.1.0",
  author: "Kiyo",
  tool: {
    name: "list",
    description: "List directory contents.",
    inputSchema: z.object({ path: z.string().optional() }),
    permission: "read",
    async run(input, ctx) {
      const p = (input as any).path || ".";
      const full = p.startsWith("/") || /^[A-Za-z]:/.test(p) ? p : `${ctx.projectRoot}/${p}`;
      const entries = await fs.readdir(full, { withFileTypes: true });
      return entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name)).join("\n");
    },
  },
});
