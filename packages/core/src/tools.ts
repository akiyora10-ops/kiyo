import type { Tool, ToolContext } from "@kiyo/plugin-sdk";
import { decidePermission, isCatastrophic } from "./permissions.js";

export interface ToolRegistry {
  tools: Map<string, Tool>;
  register(t: Tool): void;
  get(name: string): Tool | undefined;
  list(): Tool[];
}

export function createToolRegistry(): ToolRegistry {
  const tools = new Map<string, Tool>();
  return {
    tools,
    register(t) {
      tools.set(t.name, t);
    },
    get(name) {
      return tools.get(name);
    },
    list() {
      return [...tools.values()];
    },
  };
}

export interface RunResult {
  ok: boolean;
  output: string;
  error?: string;
}

const SECRET_PATTERNS = [/sk-[A-Za-z0-9]{20,}/g, /ghp_[A-Za-z0-9]{20,}/g, /AKIA[0-9A-Z]{16}/g];

export function redactSecrets(text: string): string {
  let out = text;
  for (const p of SECRET_PATTERNS) out = out.replace(p, "[REDACTED]");
  return out;
}

export async function runTool(
  reg: ToolRegistry,
  name: string,
  input: unknown,
  ctx: ToolContext,
  permissionCfg: { mode: any; rules: any[] },
  approve: (msg: string) => Promise<boolean>,
): Promise<RunResult> {
  const tool = reg.get(name);
  if (!tool) return { ok: false, output: "", error: `unknown tool: ${name}` };
  // catastrophic check for bash
  if (name === "bash" && typeof (input as any)?.command === "string") {
    if (isCatastrophic((input as any).command)) {
      return { ok: false, output: "", error: "blocked: catastrophic command" };
    }
  }
  const decision = decidePermission(permissionCfg as any, tool.name, (input as any)?.path);
  if (decision === "deny") return { ok: false, output: "", error: "permission denied" };
  if (decision === "ask") {
    const ok = await approve(`Allow ${tool.name} ${JSON.stringify(input).slice(0, 200)}?`);
    if (!ok) return { ok: false, output: "", error: "user denied" };
  }
  try {
    const parsed = tool.inputSchema.parse(input);
    const out = await tool.run(parsed, ctx);
    const text = typeof out === "string" ? out : JSON.stringify(out, null, 2);
    return { ok: true, output: redactSecrets(text) };
  } catch (e) {
    return { ok: false, output: "", error: redactSecrets((e as Error).message) };
  }
}
