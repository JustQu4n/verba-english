import { describe, expect, it } from "vitest";

import { CATEGORIES, isCategory, isLevel, LEVELS } from "./sentence-catalog";

describe("sentence catalog", () => {
  it("WSN-AC-01: lists three levels in ascending order", () => {
    expect([...LEVELS]).toEqual(["beginner", "intermediate", "advanced"]);
  });

  it("WSN-AC-02: lists twenty categories with unique ids", () => {
    expect(CATEGORIES).toHaveLength(20);
    expect(new Set(CATEGORIES).size).toBe(20);
  });

  it("WSN-AC-02: recognizes only catalog ids", () => {
    expect(isLevel("beginner")).toBe(true);
    expect(isLevel("expert")).toBe(false);
    expect(isCategory("food-drink")).toBe(true);
    expect(isCategory("Food & Drink")).toBe(false);
    expect(isCategory(undefined)).toBe(false);
  });
});
