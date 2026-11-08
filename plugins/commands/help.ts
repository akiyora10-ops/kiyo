import { definePlugin } from "@kiyo/plugin-sdk";
export default definePlugin({
  kind: "command",
  name: "help",
  description: "Show help.",
  version: "0.1.0",
  author: "Kiyo",
  usage: "/help",
  async run(ctx) {
    ctx.print(
      "Kiyo commands: /help /model /mode /undo /redo /diff /commit /compact /clear /usage /export /theme /plugins /doctor /resume /init",
    );
  },
});
