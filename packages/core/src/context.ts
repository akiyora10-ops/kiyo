export interface ContextFile {
  path: string;
  content: string;
  pinned?: boolean;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function rankFiles(files: ContextFile[], query: string): ContextFile[] {
  const q = query.toLowerCase();
  const scored = files.map((f) => {
    let score = f.pinned ? 1000 : 0;
    const lower = f.content.toLowerCase();
    if (lower.includes(q)) score += 10;
    // path relevance
    if (f.path.toLowerCase().includes(q)) score += 5;
    return { f, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.f);
}

export function buildRepoMap(root: string, files: string[]): string {
  // lightweight: list files grouped by dir
  const groups: Record<string, string[]> = {};
  for (const f of files) {
    const dir = f.includes("/") ? f.slice(0, f.lastIndexOf("/")) : ".";
    if (!groups[dir]) groups[dir] = [];
    groups[dir].push(f.slice(f.lastIndexOf("/") + 1));
  }
  const lines: string[] = [`# Repo map (${root})`];
  for (const [dir, names] of Object.entries(groups)) {
    lines.push(`${dir}/`);
    for (const _n of names.slice(0, 20)) lines.push();
  }
  return lines.join("\n");
}

export interface ContextManager {
  files: ContextFile[];
  addFile(f: ContextFile): void;
  removeFile(path: string): void;
  pin(path: string): void;
  totalTokens(): number;
  trimToBudget(budget: number): ContextFile[];
}

export function createContextManager(): ContextManager {
  const files: ContextFile[] = [];
  return {
    files,
    addFile(f) {
      files.push(f);
    },
    removeFile(p) {
      const i = files.findIndex((x) => x.path === p);
      if (i >= 0) files.splice(i, 1);
    },
    pin(p) {
      const f = files.find((x) => x.path === p);
      if (f) f.pinned = true;
    },
    totalTokens() {
      return files.reduce((a, f) => a + estimateTokens(f.content), 0);
    },
    trimToBudget(budget) {
      const ranked = rankFiles(files, "");
      const out: ContextFile[] = [];
      let used = 0;
      for (const f of ranked) {
        const t = estimateTokens(f.content);
        if (used + t > budget && !f.pinned) continue;
        out.push(f);
        used += t;
      }
      return out;
    },
  };
}
