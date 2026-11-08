import { promises as fs } from "node:fs";
import { definePlugin } from "@kiyo/plugin-sdk";
import { z } from "zod";

export default definePlugin({
  kind: "tool",
  name: "multi-edit",
  description: "Apply multiple search/replace edits to one file.",
  version: "0.1.0",
  author: "kiyo",
  tool: {
    name: "multi-edit",
    description: "Apply multiple search/replace edits to one file.",
    inputSchema: z.object({
      path: z.string(),
      edits: z.array(z.object({ search: z.string(), replace: z.string() })),
    }),
    permission: "write",
    async run(input, ctx) {
      const p = (input as any).path;
      const full = p.startsWith("/") || /^[A-Za-z]:/.test(p) ? p : `${ctx.projectRoot}/${p}`;
      let content = await fs.readFile(full, "utf8");
      for (const e of (input as any).edits) {
        const idx = content.indexOf(e.search);
        if (idx === -1) throw new Error(`search not found: ${e.search.slice(0, 40)}`);
        content = content.replace(e.search, e.replace);
      }
      await fs.writeFile(full, content, "utf8");
      return `applied ${(input as any).edits.length} edits to ${full}`;
    },
  },
});
