import { definePlugin } from "@kiyo/plugin-sdk";
export default definePlugin({
  kind: "theme",
  name: "gruvbox",
  description: "gruvbox theme.",
  version: "0.1.0",
  author: "Kiyo",
  colors: {
    primary: "#fabd2f",
    secondary: "#d3869b",
    accent: "#83a598",
    error: "#fb4934",
    success: "#b8bb26",
    muted: "#928374",
    background: "#282828",
    foreground: "#ebdbb2",
  },
});
