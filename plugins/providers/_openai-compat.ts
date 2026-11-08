import type { Provider, ProviderChunk, ProviderRequest } from "@kiyo/plugin-sdk";

export interface OAICompatConfig {
  id: string;
  displayName: string;
  baseUrl: string;
  envVar: string;
  auth?: "api-key" | "none";
  models: {
    id: string;
    name: string;
    ctx: number;
    tools?: boolean;
    vision?: boolean;
    longContext?: boolean;
  }[];
  rateLimits?: { requestsPerMinute?: number; requestsPerDay?: number; tokensPerMinute?: number };
}

export function makeOpenAICompatProvider(cfg: OAICompatConfig, apiKey?: string): Provider {
  const auth = cfg.auth ?? "api-key";
  const models = cfg.models.map((m) => ({
    id: m.id,
    displayName: m.name,
    contextWindow: m.ctx,
    capabilities: {
      tools: m.tools ?? true,
      vision: m.vision ?? false,
      longContext: m.longContext ?? false,
      streaming: true,
    },
  }));

  function headers(key?: string): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    const k = key || apiKey || process.env[cfg.envVar];
    if (auth === "api-key" && k) h.Authorization = `Bearer ${k}`;
    return h;
  }

  async function* chat(req: ProviderRequest, key?: string): AsyncIterable<ProviderChunk> {
    const body = {
      model: req.model,
      messages: req.messages,
      tools: req.tools?.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.inputSchema },
      })),
      temperature: req.temperature,
      max_tokens: req.maxTokens,
      stream: true,
    };
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: headers(key),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      yield { type: "error", error: `${res.status}: ${text.slice(0, 500)}` };
      return;
    }
    const reader = res.body?.getReader();
    if (!reader) {
      yield { type: "error", error: "no response body" };
      return;
    }
    const decoder = new TextDecoder();
    let buf = "";
    const toolCalls: Record<number, { id: string; name: string; args: string }> = {};
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta;
          if (delta?.content) yield { type: "text", text: delta.content };
          if (Array.isArray(delta?.tool_calls)) {
            for (const tc of delta.tool_calls) {
              const idx = typeof tc.index === "number" ? tc.index : 0;
              if (!toolCalls[idx]) toolCalls[idx] = { id: tc.id || "", name: "", args: "" };
              if (tc.id) toolCalls[idx].id = tc.id;
              if (tc.function?.name) toolCalls[idx].name += tc.function.name;
              if (tc.function?.arguments) toolCalls[idx].args += tc.function.arguments;
            }
          }
          const usage = json.usage;
          if (usage) {
            yield {
              type: "done",
              usage: { inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens },
            };
          }
        } catch {
          // ignore malformed chunk
        }
      }
    }
    for (const tc of Object.values(toolCalls)) {
      let args: unknown = {};
      try {
        args = JSON.parse(tc.args || "{}");
      } catch {
        args = {};
      }
      yield {
        type: "tool_call",
        toolCall: { id: tc.id || `tc_${Date.now()}`, name: tc.name, arguments: args },
      };
    }
    yield { type: "done" };
  }

  return {
    id: cfg.id,
    displayName: cfg.displayName,
    baseUrl: cfg.baseUrl,
    authMethod: auth,
    envVar: cfg.envVar,
    models,
    rateLimits: cfg.rateLimits || {},
    healthCheck: async () => {
      if (auth === "api-key" && !process.env[cfg.envVar] && !apiKey) return false;
      try {
        const res = await fetch(`${cfg.baseUrl}/models`, { headers: headers(apiKey) });
        return res.ok;
      } catch {
        return false;
      }
    },
    chat,
  };
}
