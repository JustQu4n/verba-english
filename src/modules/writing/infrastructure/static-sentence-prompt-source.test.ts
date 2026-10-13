import { describe, expect, it } from "vitest";

import { CATEGORIES, LEVELS } from "../domain/sentence-catalog";
import { StaticSentencePromptSource } from "./static-sentence-prompt-source";

describe("StaticSentencePromptSource", () => {
  const source = new StaticSentencePromptSource();

  it("WSN-AC-03: has at least one complete prompt for every level and category", async () => {
    for (const level of LEVELS) {
      for (const category of CATEGORIES) {
        const prompts = await source.list({ level, category });
        expect(prompts.length, `${level}/${category}`).toBeGreaterThan(0);
        for (const p of prompts) {
          expect(p.level).toBe(level);
          expect(p.category).toBe(category);
          expect(p.vietnamese.trim()).not.toBe("");
          expect(p.hint.trim()).not.toBe("");
        }
      }
    }
  });

  it("WSN-AC-03: prompt ids are unique across the whole bank", async () => {
    const ids: string[] = [];
    for (const level of LEVELS) {
      for (const category of CATEGORIES) {
        ids.push(...(await source.list({ level, category })).map((p) => p.id));
      }
    }
    expect(new Set(ids).size).toBe(ids.length);
  });
});
