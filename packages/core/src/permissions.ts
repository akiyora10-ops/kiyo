export type PermissionMode = "plan" | "default" | "auto-edit" | "yolo";
export type PermissionDecision = "allow" | "ask" | "deny";

export interface PermissionRule {
  tool: string;
  pattern?: string;
  decision: PermissionDecision;
}

export interface PermissionConfig {
  mode: PermissionMode;
  rules: PermissionRule[];
}

const CATASTROPHIC: RegExp[] = [
  /rm\s+-rf\s+\/(\s|$)/,
  /rm\s+-rf\s+~(\s|$)/,
  /mkfs\./,
  /:\(\)\s*\{\s*:\|:&\s*\};:/,
  /git\s+push\s+.*--force.*\b(main|master)\b/,
  /curl[^|]*\|\s*(sh|bash)/,
  /dd\s+if=/,
];

export function isCatastrophic(cmd: string): boolean {
  return CATASTROPHIC.some((r) => r.test(cmd));
}

export function decidePermission(
  cfg: PermissionConfig,
  tool: string,
  target?: string,
): PermissionDecision {
  if (cfg.mode === "plan") {
    // read-only: deny writes/executes
    if (tool === "read" || tool === "list" || tool === "glob" || tool === "grep") return "allow";
    return "deny";
  }
  if (cfg.mode === "yolo") return "allow";
  // explicit rules
  for (const r of cfg.rules) {
    if (r.tool !== tool) continue;
    if (r.pattern && target && !new RegExp(r.pattern).test(target)) continue;
    return r.decision;
  }
  if (cfg.mode === "auto-edit" && (tool === "edit" || tool === "write" || tool === "multi-edit")) {
    return "allow";
  }
  if (
    tool === "read" ||
    tool === "list" ||
    tool === "glob" ||
    tool === "grep" ||
    tool === "todo" ||
    tool === "ask-user"
  ) {
    return "allow";
  }
  return "ask";
}
