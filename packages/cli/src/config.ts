import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export interface KiyoConfig {
  mode: "plan" | "default" | "auto-edit" | "yolo";
  providers: string[];
  model?: string;
  routingMode: "free-first" | "fastest" | "best-quality" | "cheapest" | "pinned";
  permissions: { mode: string; rules: { tool: string; pattern?: string; decision: string }[] };
}

const DEFAULT: KiyoConfig = {
  mode: "default",
  providers: [],
  routingMode: "free-first",
  permissions: { mode: "default", rules: [] },
};

export async function loadConfig(cwd: string): Promise<KiyoConfig> {
  const globalPath = path.join(os.homedir(), ".kiyo", "config.json");
  const projectPath = path.join(cwd, ".kiyo", "config.json");
  let cfg = { ...DEFAULT };
  for (const p of [globalPath, projectPath]) {
    try {
      const raw = await fs.readFile(p, "utf8");
      const parsed = JSON.parse(raw);
      cfg = { ...cfg, ...parsed };
    } catch {}
  }
  return cfg;
}

export async function saveConfig(cwd: string, cfg: KiyoConfig, global = false): Promise<void> {
  const dir = global ? path.join(os.homedir(), ".kiyo") : path.join(cwd, ".kiyo");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "config.json"), JSON.stringify(cfg, null, 2), "utf8");
}
