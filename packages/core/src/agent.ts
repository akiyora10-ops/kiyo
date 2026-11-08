import type { Provider, ToolContext } from "@kiyo/plugin-sdk";
import type { ToolRegistry } from "./tools.js";
import { runTool } from "./tools.js";

export type AgentEvent =
  | { type: "text"; text: string }
  | { type: "tool_call"; name: string; args: unknown }
  | { type: "tool_result"; name: string; output: string; ok: boolean }
  | { type: "done"; reason: string }
  | { type: "error"; message: string };

export interface AgentConfig {
  provider: Provider;
  model: string;
  apiKey?: string;
  registry: ToolRegistry;
  ctx: ToolContext;
  permissionCfg: any;
  approve: (msg: string) => Promise<boolean>;
  maxIterations?: number;
  systemPrompt?: string;
}

export async function* runAgent(task: string, cfg: AgentConfig): AsyncGenerator<AgentEvent> {
  const maxIter = cfg.maxIterations ?? 25;
  const messages: {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    toolCallId?: string;
  }[] = [];
  if (cfg.systemPrompt) messages.push({ role: "system", content: cfg.systemPrompt });
  messages.push({ role: "user", content: task });

  const toolDefs = cfg.registry.list().map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: (t as any).inputSchema,
  }));

  for (let iter = 0; iter < maxIter; iter++) {
    let assistantText = "";
    const toolCalls: { id: string; name: string; arguments: unknown }[] = [];
    try {
      const stream = cfg.provider.chat(
        { model: cfg.model, messages, tools: toolDefs, stream: true },
        cfg.apiKey,
      );
      for await (const chunk of stream) {
        if (chunk.type === "text" && chunk.text) {
          assistantText += chunk.text;
          yield { type: "text", text: chunk.text };
        } else if (chunk.type === "tool_call" && chunk.toolCall) {
          toolCalls.push(chunk.toolCall);
        } else if (chunk.type === "error") {
          yield { type: "error", message: chunk.error ?? "provider error" };
          return;
        }
      }
    } catch (e) {
      yield { type: "error", message: (e as Error).message };
      return;
    }

    if (assistantText) {
      messages.push({ role: "assistant", content: assistantText });
    }

    if (toolCalls.length === 0) {
      yield { type: "done", reason: "completed" };
      return;
    }

    for (const tc of toolCalls) {
      yield { type: "tool_call", name: tc.name, args: tc.arguments };
      const result = await runTool(
        cfg.registry,
        tc.name,
        tc.arguments,
        cfg.ctx,
        cfg.permissionCfg,
        cfg.approve,
      );
      yield {
        type: "tool_result",
        name: tc.name,
        output: result.output || result.error || "",
        ok: result.ok,
      };
      messages.push({
        role: "tool",
        content: result.output || result.error || "",
        toolCallId: tc.id,
      });
    }
  }
  yield { type: "done", reason: "max iterations reached" };
}
