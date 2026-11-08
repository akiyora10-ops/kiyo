import { definePlugin } from "@kiyo/plugin-sdk";
import { execa } from "execa";
import { z } from "zod";

export default definePlugin({
  kind: "tool",
  name: "git",
  description: "Run git commands (status, diff, commit, branch).",
  version: "0.1.0",
  author: "kiyo",
  tool: {
    name: "git",
    description: "Run git commands (status, diff, commit, branch).",
    inputSchema: z.object({ args: z.string() }),
    permission: "execute",
    async run(input, ctx) {
      const { stdout, stderr, exitCode } = await execa("git", (input as any).args.split(/\s+/), {
        cwd: ctx.projectRoot,
        reject: false,
      });
      return `exit ${exitCode}\n${stdout}\n${stderr}`.trim();
    },
  },
});
