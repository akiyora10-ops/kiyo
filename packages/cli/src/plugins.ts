import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const jiti = createJiti(import.meta.url, {
  alias: {
    "@kiyo/plugin-sdk": path.join(repoRoot, "packages", "plugin-sdk", "src", "index.ts"),
    "@kiyo/core": path.join(repoRoot, "packages", "core", "src", "index.ts"),
    "@kiyo/router": path.join(repoRoot, "packages", "router", "src", "index.ts"),
  },
});

export async function loadPlugins(dirs: string[]): Promise<any[]> {
  const out: any[] = [];
  for (const dir of dirs) {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.startsWith("_") || e.startsWith(".")) continue;
      const full = path.join(dir, e);
      const stat = await fs.stat(full);
      if (stat.isDirectory()) {
        const sub = await loadPlugins([full]);
        out.push(...sub);
        continue;
      }
      if (!/\.(ts|js|md)$/.test(e)) continue;
      if (e.endsWith(".md")) {
        const raw = await fs.readFile(full, "utf8");
        const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        const meta: any = {};
        if (m)
          m[1].split("\n").forEach((l: string) => {
            const [k, ...v] = l.split(":");
            if (k) meta[k.trim()] = v.join(":").trim();
          });
        out.push({
          kind: "skill",
          name: meta.name || e.replace(".md", ""),
          description: meta.description || "",
          version: meta.version || "0.1.0",
          author: meta.author || "unknown",
          content: m ? m[2] : raw,
        });
        continue;
      }
      try {
        const mod: any = await jiti.import(full);
        const plugin = mod?.default ?? mod;
        if (plugin?.kind) out.push(plugin);
      } catch (err) {
        console.error("plugin load failed:", full, (err as Error).message);
      }
    }
  }
  return out;
}

export function pluginDirs(cwd: string): string[] {
  return [
    path.resolve("plugins"),
    path.join(os.homedir(), ".kiyo", "plugins"),
    path.join(cwd, ".kiyo", "plugins"),
  ];
}
