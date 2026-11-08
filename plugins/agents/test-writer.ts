import { definePlugin } from "@kiyo/plugin-sdk";
export default definePlugin({
  kind: "agent",
  name: "test-writer",
  description: "Writes tests for code.",
  version: "0.1.0",
  author: "Kiyo",
  systemPrompt: "You write thorough, minimal tests. Match existing test framework and style.",
  toolAllowlist: ["read", "write", "list", "glob", "grep", "bash"],
});
