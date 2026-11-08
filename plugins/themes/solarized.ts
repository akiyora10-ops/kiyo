import { definePlugin } from "@kiyo/plugin-sdk";
export default definePlugin({
  kind: "theme",
  name: "solarized",
  description: "solarized theme.",
  version: "0.1.0",
  author: "Kiyo",
  colors: {
    primary: "#268bd2",
    secondary: "#6c71c4",
    accent: "#2aa198",
    error: "#dc322f",
    success: "#859900",
    muted: "#93a1a1",
    background: "#002b36",
    foreground: "#839496",
  },
});
