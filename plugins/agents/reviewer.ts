import { definePlugin } from "@kiyo/plugin-sdk";
export default definePlugin({
  kind: "agent",
  name: "reviewer",
  description: "Code review agent.",
  version: "0.1.0",
  author: "Kiyo",
  systemPrompt:
    "You are a meticulous code reviewer. Focus on correctness, security, performance. Be concise.",
  toolAllowlist: ["read", "list", "glob", "grep", "git"],
});
