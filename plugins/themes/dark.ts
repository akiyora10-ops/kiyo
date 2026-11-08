import { definePlugin } from "@kiyo/plugin-sdk";
export default definePlugin({
  kind: "theme",
  name: "dark",
  description: "dark theme.",
  version: "0.1.0",
  author: "Kiyo",
  colors: {
    primary: "#7aa2f7",
    secondary: "#bb9af7",
    accent: "#7dcfff",
    error: "#f7768e",
    success: "#9ece6a",
    muted: "#565f89",
    background: "#1a1b26",
    foreground: "#c0caf5",
  },
});
