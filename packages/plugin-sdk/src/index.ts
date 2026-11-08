import { z } from "zod";

export type PluginKind = "provider" | "tool" | "agent" | "skill" | "theme" | "command" | "hook";

export interface PluginMeta {
  kind: PluginKind;
  name: string;
  description: string;
  version: string;
  author: string;
}

export interface Plugin<TImpl = unknown> extends PluginMeta {
  impl: TImpl;
}

// ---------- Tool ----------
export const PermissionCategory = z.enum(["read", "write", "execute", "network"]);
export type PermissionCategory = z.infer<typeof PermissionCategory>;

export interface ToolContext {
  cwd: string;
  projectRoot: string;
  env: Record<string, string | undefined>;
}

export interface Tool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  permission: PermissionCategory;
  run: (input: TInput, ctx: ToolContext) => Promise<TOutput>;
}

export interface ToolPlugin extends PluginMeta {
  kind: "tool";
  tool: Tool;
}

// ---------- Provider ----------
export interface ModelCapability {
  tools: boolean;
  vision: boolean;
  longContext: boolean;
  streaming: boolean;
}

export interface ModelInfo {
  id: string;
  displayName: string;
  contextWindow: number;
  capabilities: ModelCapability;
}

export interface RateLimitMeta {
  requestsPerMinute?: number;
  requestsPerDay?: number;
  tokensPerMinute?: number;
}

export type AuthMethod = "api-key" | "none" | "oauth";

export interface ProviderRequest {
  model: string;
  messages: {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    toolCallId?: string;
    toolCalls?: { id: string; name: string; arguments: unknown }[];
    name?: string;
  }[];
  tools?: { name: string; description: string; inputSchema: unknown }[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ProviderChunk {
  type: "text" | "tool_call" | "done" | "error" | "provider_switch";
  text?: string;
  toolCall?: { id: string; name: string; arguments: unknown };
  error?: string;
  usage?: { inputTokens: number; outputTokens: number };
  provider?: string;
  model?: string;
}

export interface Provider {
  id: string;
  displayName: string;
  baseUrl: string;
  authMethod: AuthMethod;
  envVar: string;
  models: ModelInfo[];
  rateLimits: RateLimitMeta;
  healthCheck: () => Promise<boolean>;
  chat: (req: ProviderRequest, apiKey?: string) => AsyncIterable<ProviderChunk>;
}

export interface ProviderPlugin extends PluginMeta {
  kind: "provider";
  provider: Provider;
}

// ---------- Agent ----------
export interface AgentPlugin extends PluginMeta {
  kind: "agent";
  systemPrompt: string;
  toolAllowlist?: string[];
  modelPreference?: string;
}

// ---------- Skill ----------
export interface SkillPlugin extends PluginMeta {
  kind: "skill";
  content: string;
}

// ---------- Theme ----------
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  success: string;
  muted: string;
  background: string;
  foreground: string;
}

export interface ThemePlugin extends PluginMeta {
  kind: "theme";
  colors: ThemeColors;
}

// ---------- Command ----------
export interface CommandContext {
  args: string;
  print: (msg: string) => void;
}

export interface CommandPlugin extends PluginMeta {
  kind: "command";
  usage: string;
  run: (ctx: CommandContext) => Promise<void>;
}

// ---------- Hook ----------
export type HookEvent = "beforeTool" | "afterTool" | "sessionStart" | "sessionEnd" | "fileEdit";

export interface HookPlugin extends PluginMeta {
  kind: "hook";
  event: HookEvent;
  run: (payload: unknown) => Promise<void> | void;
}

export type AnyPlugin =
  | ProviderPlugin
  | ToolPlugin
  | AgentPlugin
  | SkillPlugin
  | ThemePlugin
  | CommandPlugin
  | HookPlugin;

export function definePlugin<P extends AnyPlugin>(p: P): P {
  return p;
}

// ---------- Validators ----------
export const PluginMetaSchema = z.object({
  kind: z.enum(["provider", "tool", "agent", "skill", "theme", "command", "hook"]),
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().min(1),
  author: z.string().min(1),
});

export function validatePlugin(p: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof p !== "object" || p === null) {
    return { ok: false, errors: ["plugin must be an object"] };
  }
  const meta = PluginMetaSchema.safeParse(p);
  if (!meta.success) {
    for (const i of meta.error.issues) errors.push(`${i.path.join(".")}: ${i.message}`);
  }
  return { ok: errors.length === 0, errors };
}
