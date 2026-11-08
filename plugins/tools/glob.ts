import { glob as fg } from "node:fs/promises";
import { definePlugin } from "@kiyo/plugin-sdk";
import { z } from "zod";

export default definePlugin({
  kind: "tool",
  name: "glob",
  description: "Find files matching a glob pattern.",
  version: "0.1.0",
  author: "Kiyo",
  tool: {
    name: "glob",
    description: "Find files matching a glob pattern.",
    inputSchema: z.object({ pattern: z.string(), cwd: z.string().optional() }),
    permission: "read",
    async run(input, ctx) {
      const root = (input as any).cwd || ctx.projectRoot;
      const out: string[] = [];
      for await (const f of fg((input as any).pattern, { cwd: root })) {
        out.push(String(f));
        if (out.length > 500) break;
      }
      return out.join("\n");
    },
  },
});
