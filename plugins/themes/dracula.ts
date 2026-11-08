import { definePlugin } from "@kiyo/plugin-sdk";
export default definePlugin({
  kind: "theme",
  name: "dracula",
  description: "dracula theme.",
  version: "0.1.0",
  author: "Kiyo",
  colors: {
    primary: "#bd93f9",
    secondary: "#ff79c6",
    accent: "#8be9fd",
    error: "#ff5555",
    success: "#50fa7b",
    muted: "#6272a4",
    background: "#282a36",
    foreground: "#f8f8f2",
  },
});
