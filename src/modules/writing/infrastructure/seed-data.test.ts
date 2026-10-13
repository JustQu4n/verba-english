import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CATEGORIES, LEVELS } from "../domain/sentence-catalog";

const seed = readFileSync(join(process.cwd(), "supabase", "seed.sql"), "utf8");
// Each row is ('level', 'category', 'vietnamese', 'hint'); quotes inside text are doubled.
const ROW = /^ {2}\('(\w+)', '([a-z-]+)', '((?:[^']|'')*)', '((?:[^']|'')*)'\),?$/gm;
const rows = [...seed.matchAll(ROW)].map(([, level, category, vietnamese, hint]) => ({
  level,
  category,
  vietnamese,
  hint,
}));

describe("supabase/seed.sql", () => {
  it("WSN-AC-03: has at least one complete prompt for every level and category", () => {
    for (const level of LEVELS) {
      for (const category of CATEGORIES) {
        const found = rows.filter((r) => r.level === level && r.category === category);
        expect(found.length, `${level}/${category}`).toBeGreaterThan(0);
        for (const r of found) {
          expect(r.vietnamese.trim()).not.toBe("");
          expect(r.hint.trim()).not.toBe("");
        }
      }
    }
  });

  it("WSN-AC-03: uses only known levels and categories, and no sentence twice", () => {
    for (const r of rows) {
      expect(LEVELS as readonly string[]).toContain(r.level);
      expect(CATEGORIES as readonly string[]).toContain(r.category);
    }
    const keys = rows.map((r) => `${r.level}|${r.category}|${r.vietnamese}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
