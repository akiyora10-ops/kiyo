import type { Provider, ProviderChunk, ProviderRequest } from "@kiyo/plugin-sdk";

export type RoutingMode = "free-first" | "fastest" | "best-quality" | "cheapest" | "pinned";

export interface ProviderHealth {
  providerId: string;
  healthy: boolean;
  cooldownUntil?: number;
  requestsToday: number;
  tokensToday: number;
  lastError?: string;
}

export interface RouterConfig {
  providers: Provider[];
  mode: RoutingMode;
  pinnedModel?: string;
}

export interface Selection {
  provider: Provider;
  model: string;
}

export type RouteChunk = ProviderChunk;

export class ProviderRouter {
  health: Map<string, ProviderHealth> = new Map();
  constructor(private cfg: RouterConfig) {
    for (const p of cfg.providers) {
      this.health.set(p.id, { providerId: p.id, healthy: true, requestsToday: 0, tokensToday: 0 });
    }
  }

  private isAvailable(p: Provider): boolean {
    const h = this.health.get(p.id);
    if (!h) return false;
    if (!h.healthy) return false;
    if (h.cooldownUntil && Date.now() < h.cooldownUntil) return false;
    if (p.authMethod === "api-key" && !process.env[p.envVar]) return false;
    return true;
  }

  private pickModel(
    p: Provider,
    required: { tools?: boolean; vision?: boolean; longContext?: boolean },
  ): string {
    const models = p.models.filter((m) => {
      if (required.tools && !m.capabilities.tools) return false;
      if (required.vision && !m.capabilities.vision) return false;
      if (required.longContext && !m.capabilities.longContext) return false;
      return true;
    });
    const pool = models.length ? models : p.models;
    return pool[0]?.id ?? p.models[0]?.id ?? "";
  }

  select(
    required: { tools?: boolean; vision?: boolean; longContext?: boolean } = {},
  ): Selection | null {
    const candidates = this.cfg.providers.filter((p) => this.isAvailable(p));
    if (this.cfg.mode === "pinned" && this.cfg.pinnedModel) {
      const p = candidates.find((x) => x.models.some((m) => m.id === this.cfg.pinnedModel));
      if (p) return { provider: p, model: this.cfg.pinnedModel };
      return null;
    }
    const filtered = candidates.filter((p) =>
      p.models.some((m) => {
        if (required.tools && !m.capabilities.tools) return false;
        if (required.vision && !m.capabilities.vision) return false;
        if (required.longContext && !m.capabilities.longContext) return false;
        return true;
      }),
    );
    const pool = filtered.length ? filtered : candidates;
    if (pool.length === 0) return null;
    // free-first: first available (already in config order)
    const p = pool[0];
    return { provider: p, model: this.pickModel(p, required) };
  }

  markRateLimited(providerId: string, retryAfterMs: number): void {
    const h = this.health.get(providerId);
    if (h) {
      h.cooldownUntil = Date.now() + retryAfterMs;
      h.lastError = "rate limited";
    }
  }

  markFailure(providerId: string, err: string): void {
    const h = this.health.get(providerId);
    if (h) {
      h.healthy = false;
      h.lastError = err;
      setTimeout(() => {
        if (h) h.healthy = true;
      }, 60_000);
    }
  }

  markSuccess(providerId: string, tokens: number): void {
    const h = this.health.get(providerId);
    if (h) {
      h.requestsToday++;
      h.tokensToday += tokens;
      h.healthy = true;
    }
  }

  private header(headers: Record<string, string>, name: string): string | undefined {
    const lower = name.toLowerCase();
    for (const k of Object.keys(headers)) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return undefined;
  }

  parseRetryAfter(headers: Record<string, string>): number {
    const ra = this.header(headers, "retry-after");
    if (ra) {
      const secs = parseInt(ra, 10);
      if (!Number.isNaN(secs)) return secs * 1000;
      const t = Date.parse(ra);
      if (!Number.isNaN(t)) return Math.max(0, t - Date.now());
    }
    for (const name of [
      "x-ratelimit-reset",
      "x-ratelimit-reset-requests",
      "x-ratelimit-reset-tokens",
    ]) {
      const v = this.header(headers, name);
      if (!v) continue;
      const n = Number(v);
      if (!Number.isNaN(n)) {
        if (n > 1e12) return Math.max(0, n - Date.now());
        if (n > 1e9) return Math.max(0, n * 1000 - Date.now());
        return n * 1000;
      }
      const t = Date.parse(v);
      if (!Number.isNaN(t)) return Math.max(0, t - Date.now());
    }
    return 30_000;
  }

  async *chatWithFallback(req: ProviderRequest, apiKey?: string): AsyncIterable<ProviderChunk> {
    const required = { tools: !!(req.tools && req.tools.length) };
    const tried = new Set<string>();
    let lastError = "no provider available";
    let first = true;
    while (true) {
      const sel = this.select(required);
      if (!sel || tried.has(sel.provider.id)) break;
      tried.add(sel.provider.id);
      if (!first) {
        yield { type: "provider_switch", provider: sel.provider.id, model: sel.model };
      }
      first = false;
      let emittedText = false;
      let failed = false;
      try {
        for await (const chunk of sel.provider.chat({ ...req, model: sel.model }, apiKey)) {
          if (chunk.type === "text" && chunk.text) emittedText = true;
          if (chunk.type === "error") {
            failed = true;
            lastError = chunk.error ?? lastError;
            break;
          }
          yield chunk;
        }
      } catch (e) {
        failed = true;
        lastError = (e as Error).message;
      }
      if (!failed) {
        this.markSuccess(sel.provider.id, 0);
        return;
      }
      // best-effort rate limit detection
      if (/429|rate/i.test(lastError)) {
        this.markRateLimited(sel.provider.id, 30_000);
      } else {
        this.markFailure(sel.provider.id, lastError);
      }
      if (emittedText) {
        yield { type: "error", error: lastError };
        return;
      }
    }
    yield { type: "error", error: lastError };
  }

  usageReport(): string {
    const lines: string[] = [];
    for (const [id, h] of this.health) {
      lines.push(`${id}: requests=${h.requestsToday} tokens=${h.tokensToday} healthy=${h.healthy}`);
    }
    return lines.join("\n");
  }
}

export function createRouter(cfg: RouterConfig): ProviderRouter {
  return new ProviderRouter(cfg);
}
