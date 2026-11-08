import { definePlugin } from "@kiyo/plugin-sdk";
export default definePlugin({
  kind: "command",
  name: "doctor",
  description: "Diagnose environment.",
  version: "0.1.0",
  author: "Kiyo",
  usage: "/doctor",
  async run(ctx) {
    ctx.print("Run: Kiyo doctor");
  },
});
