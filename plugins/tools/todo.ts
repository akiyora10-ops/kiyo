import { definePlugin } from "@kiyo/plugin-sdk";
import { z } from "zod";

const todos: { id: string; content: string; status: string }[] = [];

export default definePlugin({
  kind: "tool",
  name: "todo",
  description: "Manage the agent task list.",
  version: "0.1.0",
  author: "kiyo",
  tool: {
    name: "todo",
    description: "Manage the agent task list.",
    inputSchema: z.object({
      action: z.enum(["add", "list", "done"]),
      content: z.string().optional(),
      id: z.string().optional(),
    }),
    permission: "read",
    async run(input) {
      const a = (input as any).action;
      if (a === "add") {
        const t = {
          id: `t_${todos.length + 1}`,
          content: (input as any).content || "",
          status: "pending",
        };
        todos.push(t);
        return `added ${t.id}`;
      }
      if (a === "done") {
        const t = todos.find((x) => x.id === (input as any).id);
        if (t) t.status = "done";
        return "ok";
      }
      return todos.map((t) => `${t.id} [${t.status}] ${t.content}`).join("\n") || "empty";
    },
  },
});
