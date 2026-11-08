import type { Provider } from "@kiyo/plugin-sdk";

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
    return true;
  }

  select(
    required: { tools?: boolean; vision?: boolean; longContext?: boolean } = {},
  ): Provider | null {
    const candidates = this.cfg.providers.filter((p) => this.isAvailable(p));
    if (this.cfg.mode === "pinned" && this.cfg.pinnedModel) {
      const p = candidates.find((x) => x.models.some((m) => m.id === this.cfg.pinnedModel));
      return p ?? null;
    }
    // filter by capability
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
    // simple: first available (free-first default)
    return pool[0];
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
      // auto-recover after 60s
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

  parseRetryAfter(headers: Record<string, string>): number {
    const ra = headers["retry-after"];
    if (ra) {
      const secs = parseInt(ra, 10);
      if (!Number.isNaN(secs)) return secs * 1000;
    }
    const reset = headers["x-ratelimit-reset"];
    if (reset) {
      const ms = parseInt(reset, 10);
      if (!Number.isNaN(ms)) return Math.max(0, ms - Date.now());
    }
    return 30_000;
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
