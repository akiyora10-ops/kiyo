import { definePlugin } from "@kiyo/plugin-sdk";
import { execa } from "execa";
import { z } from "zod";

export default definePlugin({
  kind: "tool",
  name: "bash",
  description: "Run a shell command with timeout.",
  version: "0.1.0",
  author: "kiyo",
  tool: {
    name: "bash",
    description: "Run a shell command with timeout.",
    inputSchema: z.object({
      command: z.string(),
      timeout: z.number().optional(),
      cwd: z.string().optional(),
    }),
    permission: "execute",
    async run(input, ctx) {
      const cmd = (input as any).command;
      const timeout = (input as any).timeout ?? 120000;
      const cwd = (input as any).cwd || ctx.projectRoot;
      const { stdout, stderr, exitCode } = await execa(cmd, {
        shell: true,
        cwd,
        timeout,
        reject: false,
      });
      const out = [stdout, stderr].filter(Boolean).join("\n");
      const truncated = out.length > 30000 ? `${out.slice(0, 30000)}\n...[truncated]` : out;
      return `exit ${exitCode}\n${truncated}`;
    },
  },
});
