import { promises as fs } from "node:fs";
import path from "node:path";
import { definePlugin } from "@kiyo/plugin-sdk";
import { z } from "zod";

async function walk(dir: string, files: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      await walk(full, files);
    } else {
      files.push(full);
    }
  }
}

export default definePlugin({
  kind: "tool",
  name: "grep",
  description: "Search file contents for a pattern.",
  version: "0.1.0",
  author: "Kiyo",
  tool: {
    name: "grep",
    description: "Search file contents for a pattern.",
    inputSchema: z.object({
      pattern: z.string(),
      path: z.string().optional(),
      include: z.string().optional(),
    }),
    permission: "read",
    async run(input, ctx) {
      const root = (input as any).path
        ? (input as any).path.startsWith("/") || /^[A-Za-z]:/.test((input as any).path)
          ? (input as any).path
          : `${ctx.projectRoot}/${(input as any).path}`
        : ctx.projectRoot;
      const re = new RegExp((input as any).pattern, "i");
      const files: string[] = [];
      await walk(root, files);
      const results: string[] = [];
      for (const f of files) {
        try {
          const content = await fs.readFile(f, "utf8");
          const lines = content.split("\n");
          lines.forEach((line, i) => {
            if (re.test(line)) results.push(`${f}:${i + 1}: ${line.trim()}`);
          });
        } catch {}
        if (results.length > 200) break;
      }
      return results.join("\n") || "no matches";
    },
  },
});
