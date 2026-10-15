import { describe, expect, it } from "vitest";

import { CATEGORIES, LEVELS } from "./sentence-catalog";
import { withCategoryProgress, type AllLevelsProgress } from "./sentence-progress";

function sample(): AllLevelsProgress {
  return Object.fromEntries(
    LEVELS.map((level) => [level, Object.fromEntries(CATEGORIES.map((c) => [c, { completed: 1, total: 5 }]))])
  ) as AllLevelsProgress;
}

describe("withCategoryProgress", () => {
  it("SPG-AC-17: replaces only the given level and category, without changing the original", () => {
    const original = sample();
    const next = withCategoryProgress(original, "intermediate", "food-drink", { completed: 4, total: 5 });
    expect(next?.intermediate["food-drink"]).toEqual({ completed: 4, total: 5 });
    expect(next?.intermediate["everyday-life"]).toEqual({ completed: 1, total: 5 });
    expect(next?.beginner["food-drink"]).toEqual({ completed: 1, total: 5 });
    expect(original.intermediate["food-drink"]).toEqual({ completed: 1, total: 5 });
  });

  it("SPG-AC-17: without loaded progress it stays null", () => {
    expect(withCategoryProgress(null, "beginner", "food-drink", { completed: 1, total: 2 })).toBeNull();
  });
});
