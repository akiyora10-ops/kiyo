import { definePlugin } from "@kiyo/plugin-sdk";
export default definePlugin({
  kind: "hook",
  name: "secret-scan",
  description: "Scan for secrets on file edit.",
  version: "0.1.0",
  author: "Kiyo",
  event: "fileEdit",
  async run() {},
});
