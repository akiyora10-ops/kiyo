import { describe, expect, it } from "vitest";
import { fuzzyFind } from "../packages/core/src/edit-engine.js";

describe("edit-engine", () => {
  it("finds exact", () => {
    const r = fuzzyFind("hello world", "world");
    expect(r).not.toBeNull();
  });
  it("returns null when missing", () => {
    expect(fuzzyFind("hello", "xyz")).toBeNull();
  });
});
