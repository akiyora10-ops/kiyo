import { definePlugin } from "@kiyo/plugin-sdk";
export default definePlugin({
  kind: "theme",
  name: "high-contrast",
  description: "high-contrast theme.",
  version: "0.1.0",
  author: "Kiyo",
  colors: {
    primary: "#ffffff",
    secondary: "#ffff00",
    accent: "#00ffff",
    error: "#ff0000",
    success: "#00ff00",
    muted: "#808080",
    background: "#000000",
    foreground: "#ffffff",
  },
});
