import { definePlugin } from "@kiyo/plugin-sdk";
export default definePlugin({
  kind: "theme",
  name: "light",
  description: "light theme.",
  version: "0.1.0",
  author: "Kiyo",
  colors: {
    primary: "#2563eb",
    secondary: "#7c3aed",
    accent: "#0891b2",
    error: "#dc2626",
    success: "#16a34a",
    muted: "#6b7280",
    background: "#ffffff",
    foreground: "#111827",
  },
});
