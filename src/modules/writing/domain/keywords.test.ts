import { describe, expect, it } from "vitest";

import { joinKeywords, mergeKeywords, parseKeywords } from "./keywords";

describe("keywords", () => {
  it("APR-AC-22: text is split on commas and line breaks, trimmed, without blanks or repeats", () => {
    expect(parseKeywords(" want ,go to,, the  beach\nWANT; swim ")).toEqual(["want", "go to", "the beach", "swim"]);
    expect(parseKeywords("  ,  ")).toEqual([]);
  });

  it("APR-AC-22: words are stored as one comma-separated hint, and an old hint reads back the same", () => {
    const hint = "want, go to, beach";
    expect(joinKeywords(parseKeywords(hint))).toBe(hint);
  });

  it("APR-AC-23: merging keeps the existing words first and skips repeats in any letter case", () => {
    expect(mergeKeywords(["Want", "beach"], ["want", "swim", "BEACH", "sunny"])).toEqual(["Want", "beach", "swim", "sunny"]);
  });

  it("APR-AC-23: merging stops before the hint would pass the length limit", () => {
    expect(mergeKeywords(["aaaa"], ["bbbb", "cccc", "dddd"], 14)).toEqual(["aaaa", "bbbb"]);
  });
});
