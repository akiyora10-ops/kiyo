import { definePlugin } from "@kiyo/plugin-sdk";
import { z } from "zod";
import { applyEdit } from "../../packages/core/src/edit-engine.js";

export default definePlugin({
  kind: "tool",
  name: "edit",
  description: "Search and replace in a file.",
  version: "0.1.0",
  author: "Kiyo",
  tool: {
    name: "edit",
    description: "Search and replace in a file.",
    inputSchema: z.object({ path: z.string(), search: z.string(), replace: z.string() }),
    permission: "write",
    async run(input, ctx) {
      const p = (input as any).path;
      const full = p.startsWith("/") || /^[A-Za-z]:/.test(p) ? p : `${ctx.projectRoot}/${p}`;
      const r = await applyEdit(full, {
        search: (input as any).search,
        replace: (input as any).replace,
      });
      if (!r.ok) throw new Error(r.error);
      return edited;
    },
  },
});
