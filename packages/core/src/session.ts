import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export interface SessionMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  timestamp: number;
}

export interface Session {
  id: string;
  createdAt: number;
  messages: SessionMessage[];
  provider?: string;
  model?: string;
}

function sessionsDir(): string {
  return path.join(os.homedir(), ".Kiyo", "sessions");
}

export async function ensureSessionsDir(): Promise<void> {
  await fs.mkdir(sessionsDir(), { recursive: true });
}

export function newSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveSession(s: Session): Promise<void> {
  await ensureSessionsDir();
  const file = path.join(sessionsDir(), `${s.id}.jsonl`);
  const lines = s.messages.map((m) => JSON.stringify(m));
  await fs.writeFile(file, `${lines.join("\n")}\n`, "utf8");
}

export async function loadSession(id: string): Promise<Session | null> {
  const file = path.join(sessionsDir(), `${id}.jsonl`);
  try {
    const raw = await fs.readFile(file, "utf8");
    const messages = raw
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as SessionMessage);
    return { id, createdAt: Date.now(), messages };
  } catch {
    return null;
  }
}

export async function listSessions(): Promise<string[]> {
  await ensureSessionsDir();
  const entries = await fs.readdir(sessionsDir());
  return entries.filter((e) => e.endsWith(".jsonl")).map((e) => e.replace(".jsonl", ""));
}
