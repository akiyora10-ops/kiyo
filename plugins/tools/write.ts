import { promises as fs } from "node:fs";
import path from "node:path";
import { definePlugin } from "@kiyo/plugin-sdk";
import { z } from "zod";

export default definePlugin({
  kind: "tool",
  name: "write",
  description: "Write content to a file (creates or overwrites).",
  version: "0.1.0",
  author: "Kiyo",
  tool: {
    name: "write",
    description: "Write content to a file (creates or overwrites).",
    inputSchema: z.object({ path: z.string(), content: z.string() }),
    permission: "write",
    async run(input, ctx) {
      const p = (input as any).path;
      const full = p.startsWith("/") || /^[A-Za-z]:/.test(p) ? p : `${ctx.projectRoot}/${p}`;
       const content = (input as any).content as string;
       if (/sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}/.test(content)) {
         throw new Error("refusing to write detected secret");
       }
       await fs.mkdir(path.dirname(full), { recursive: true });
       await fs.writeFile(full, content, "utf8");
       return `wrote ${full}`;
    },
  },
});
