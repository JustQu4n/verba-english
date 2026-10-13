import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { answerKey, MAX_ACCEPTED_ANSWERS, MAX_ANSWER_TEXT_LENGTH, MAX_STRUCTURE_LENGTH } from "../domain/accepted-answer";
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

// Each answers row is ('level', 'category', 'vietnamese', $j$[json]$j$::jsonb).
const ANSWER_ROW = /^ {2}\('(\w+)', '([a-z-]+)', '((?:[^']|'')*)', \$j\$(.*)\$j\$::jsonb\),?$/gm;
const answerRows = [...seed.matchAll(ANSWER_ROW)].map(([, level, category, vietnamese, json]) => ({
  level,
  category,
  vietnamese,
  answers: JSON.parse(json) as { text: string; structureVi: string; structureEn: string }[],
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

  it("ANS-AC-17: every seed sentence has accepted answers with grammar notes in both languages", () => {
    expect(answerRows).toHaveLength(rows.length);
    for (const row of rows) {
      const found = answerRows.filter((a) => a.level === row.level && a.category === row.category && a.vietnamese === row.vietnamese);
      expect(found, row.vietnamese).toHaveLength(1);
    }
    for (const { answers, vietnamese } of answerRows) {
      expect(answers.length, vietnamese).toBeGreaterThanOrEqual(1);
      expect(answers.length, vietnamese).toBeLessThanOrEqual(MAX_ACCEPTED_ANSWERS);
      for (const a of answers) {
        expect(a.text.trim(), vietnamese).not.toBe("");
        expect(a.text.length).toBeLessThanOrEqual(MAX_ANSWER_TEXT_LENGTH);
        expect(a.structureVi.trim(), a.text).not.toBe("");
        expect(a.structureEn.trim(), a.text).not.toBe("");
        expect(a.structureVi.length).toBeLessThanOrEqual(MAX_STRUCTURE_LENGTH);
        expect(a.structureEn.length).toBeLessThanOrEqual(MAX_STRUCTURE_LENGTH);
      }
    }
  });

  it("ANS-AC-17: no two answers of a sentence are the same after normalising", () => {
    for (const { answers, vietnamese } of answerRows) {
      const keys = answers.map((a) => answerKey(a.text));
      expect(new Set(keys).size, vietnamese).toBe(keys.length);
    }
  });
});
