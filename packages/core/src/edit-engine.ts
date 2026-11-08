import { promises as fs } from "node:fs";

export interface EditOp {
  search: string;
  replace: string;
}

export interface Checkpoint {
  id: string;
  files: { path: string; content: string }[];
  createdAt: number;
}

const checkpoints: Checkpoint[] = [];

export async function readFileSafe(p: string): Promise<string> {
  return fs.readFile(p, "utf8");
}

export function fuzzyFind(
  content: string,
  search: string,
): { index: number; matched: string } | null {
  if (content.includes(search)) return { index: content.indexOf(search), matched: search };
  // normalize whitespace
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const nContent = norm(content);
  const nSearch = norm(search);
  const idx = nContent.indexOf(nSearch);
  if (idx === -1) return null;
  // map back approximately: find line-based
  const lines = content.split("\n");
  const searchLines = search.split("\n").map((l) => l.trim());
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === searchLines[0]) {
      let ok = true;
      for (let j = 1; j < searchLines.length; j++) {
        if (i + j >= lines.length || lines[i + j].trim() !== searchLines[j]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        const start = content.indexOf(lines[i]);
        return { index: start, matched: lines.slice(i, i + searchLines.length).join("\n") };
      }
    }
  }
  return null;
}

export async function applyEdit(
  filePath: string,
  op: EditOp,
): Promise<{ ok: boolean; error?: string }> {
  let content: string;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch (e) {
    return { ok: false, error: `cannot read ${filePath}: ${(e as Error).message}` };
  }
  const found = fuzzyFind(content, op.search);
  if (!found) return { ok: false, error: "search string not found" };
  const newContent = content.replace(found.matched, op.replace);
  // atomic write
  const tmp = `${filePath}.Kiyotmp`;
  await fs.writeFile(tmp, newContent, "utf8");
  await fs.rename(tmp, filePath);
  return { ok: true };
}

export async function applyPatch(
  _filePath: string,
  _patch: string,
): Promise<{ ok: boolean; error?: string }> {
  // minimal: treat patch as full replacement if starts with @@ not handled; here apply simple search/replace blocks
  return { ok: false, error: "patch application not implemented in v0.1 (TODO)" };
}

export async function createCheckpoint(paths: string[]): Promise<Checkpoint> {
  const files = await Promise.all(
    paths.map(async (p) => ({ path: p, content: await fs.readFile(p, "utf8").catch(() => "") })),
  );
  const cp: Checkpoint = { id: `cp_${Date.now()}`, files, createdAt: Date.now() };
  checkpoints.push(cp);
  return cp;
}

export function listCheckpoints(): Checkpoint[] {
  return [...checkpoints];
}

export async function restoreCheckpoint(id: string): Promise<boolean> {
  const cp = checkpoints.find((c) => c.id === id);
  if (!cp) return false;
  for (const f of cp.files) {
    await fs.writeFile(f.path, f.content, "utf8");
  }
  return true;
}
