import { describe, expect, it } from "vitest";
import { decidePermission, isCatastrophic } from "../packages/core/src/permissions.js";

describe("permissions", () => {
  it("blocks catastrophic", () => {
    expect(isCatastrophic("rm -rf /")).toBe(true);
    expect(isCatastrophic("ls")).toBe(false);
  });
  it("plan mode denies writes", () => {
    expect(decidePermission({ mode: "plan", rules: [] }, "write")).toBe("deny");
    expect(decidePermission({ mode: "plan", rules: [] }, "read")).toBe("allow");
  });
});
