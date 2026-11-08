import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { createToolRegistry, runAgent } from "@kiyo/core";
import type { Provider } from "@kiyo/plugin-sdk";
import { createRouter } from "@kiyo/router";
import { loadConfig } from "./config.js";
import { loadPlugins, pluginDirs } from "./plugins.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VERSION = JSON.parse(readFileSync(path.join(__dirname, "..", "package.json"), "utf8"))
  .version as string;

async function buildSystemPrompt(cwd: string): Promise<string> {
  const parts = ["You are Kiyo, a helpful coding agent."];
  for (const name of ["AGENTS.md", "KIYO.md"]) {
    try {
      parts.push(`\n\n# ${name}\n` + (await fs.readFile(path.join(cwd, name), "utf8")));
    } catch {}
  }
  try {
    const entries = await fs.readdir(cwd, { withFileTypes: true, recursive: true } as any);
    const files = entries
      .filter((e: any) => e.isFile())
      .map((e: any) => path.relative(cwd, path.join(e.parentPath || e.path || cwd, e.name)))
      .slice(0, 200);
    if (files.length) parts.push("\n\n# Repo files\n" + files.join("\n"));
  } catch {}
  return parts.join("");
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--version" || args[0] === "-v") {
    console.log(VERSION);
    return;
  }
  if (args[0] === "--help" || args[0] === "-h") {
    console.log(`kiyo ${VERSION}`);
    console.log("Usage: kiyo [--version] [--help] [doctor|plugin ...|run <task>]");
    return;
  }
  const cwd = process.cwd();
  const cfg = await loadConfig(cwd);

  if (args[0] === "doctor") {
    console.log("kiyo doctor");
    console.log("node:", process.version);
    console.log("mode:", cfg.mode);
    const plugins = await loadPlugins(pluginDirs(cwd));
    console.log("plugins loaded:", plugins.length);
    const providers = plugins.filter((p) => p.kind === "provider");
    for (const p of providers) {
      const ok = await p.provider.healthCheck();
      console.log(" provider", p.name, ok ? "OK" : "FAIL");
    }
    return;
  }

  if (args[0] === "plugin") {
    const sub = args[1];
    if (sub === "list") {
      const plugins = await loadPlugins(pluginDirs(cwd));
      for (const p of plugins) console.log(p.kind, p.name, "-", p.description);
      return;
    }
    if (sub === "validate") {
      const { validatePlugin } = await import("@kiyo/plugin-sdk");
      const file = args[2];
      const jiti = (await import("jiti")).createJiti(import.meta.url);
      const mod: any = await jiti.import(file);
      const res = validatePlugin(mod.default ?? mod);
      console.log(res.ok ? "valid" : `invalid: ${res.errors.join("; ")}`);
      return;
    }
    console.log("usage: kiyo plugin list|validate <file>");
    return;
  }

  const plugins = await loadPlugins(pluginDirs(cwd));
  const providers: Provider[] = plugins.filter((p) => p.kind === "provider").map((p) => p.provider);
  const registry = createToolRegistry();
  for (const t of plugins.filter((p) => p.kind === "tool")) registry.register(t.tool);

  const router = createRouter({ providers, mode: cfg.routingMode, pinnedModel: cfg.model });

  if (args[0] === "run") {
    const task = args.slice(1).join(" ");
    const sel = router.select({ tools: true });
    if (!sel) {
      console.error("no provider available");
      process.exit(1);
    }
    const provider = sel.provider;
    const model = sel.model;
    console.log("provider:", provider.id, "model:", model);
    const ctx = { cwd, projectRoot: cwd, env: process.env as any };
    const permissionCfg = cfg.permissions;
    const gen = runAgent(task, {
      provider,
      model,
      chat: (req, key) => router.chatWithFallback(req, key),
      registry,
      ctx,
      permissionCfg,
      approve: async (msg) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const ans = await new Promise<string>((resolve) => rl.question(`${msg} [y/N] `, resolve));
        rl.close();
        return /^y(es)?$/i.test(ans.trim());
      },
      systemPrompt: await buildSystemPrompt(cwd),
    });
    for await (const ev of gen) {
      if (ev.type === "text") process.stdout.write(ev.text);
      else if (ev.type === "tool_call") console.log("\\n[tool]", ev.name, JSON.stringify(ev.args));
      else if (ev.type === "tool_result") console.log("[result]", ev.ok, ev.output.slice(0, 500));
      else if (ev.type === "provider_switch") console.log("\\n[switch]", ev.provider, ev.model);
      else if (ev.type === "done") console.log("\\n[done]", ev.reason);
      else if (ev.type === "error") console.error("\\n[error]", ev.message);
    }
    return;
  }

  // interactive
  console.log("Kiyo v0.1.0. Type /help for commands, /exit to quit.");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "kiyo> ",
  });
  rl.prompt();
  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }
    if (input === "/exit" || input === "/quit") {
      rl.close();
      return;
    }
    if (input.startsWith("/")) {
      console.log("command:", input);
      rl.prompt();
      return;
    }
    const sel = router.select({ tools: true });
    if (!sel) {
      console.error("no provider");
      rl.prompt();
      return;
    }
    const provider = sel.provider;
    const model = cfg.model || sel.model;
    const ctx = { cwd, projectRoot: cwd, env: process.env as any };
    const gen = runAgent(input, {
      provider,
      model,
      chat: (req, key) => router.chatWithFallback(req, key),
      registry,
      ctx,
      permissionCfg: cfg.permissions,
      approve: async (msg) => {
        console.log(msg);
        return true;
      },
      systemPrompt: await buildSystemPrompt(cwd),
    });
    for await (const ev of gen) {
      if (ev.type === "text") process.stdout.write(ev.text);
      else if (ev.type === "tool_call") console.log("\\n[tool]", ev.name);
      else if (ev.type === "tool_result") console.log("[result]", ev.ok);
      else if (ev.type === "provider_switch") console.log("\\n[switch]", ev.provider, ev.model);
      else if (ev.type === "done") console.log("\\n[done]", ev.reason);
      else if (ev.type === "error") console.error("\\n[error]", ev.message);
    }
    console.log();
    rl.prompt();
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
