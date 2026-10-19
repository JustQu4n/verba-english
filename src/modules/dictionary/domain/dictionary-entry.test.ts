import { describe, expect, it } from "vitest";

import { bareEntry, cleanWord, parseEntry } from "./dictionary-entry";

describe("cleanWord", () => {
  it("DIC-AC-01: trims punctuation, joins spaces, lower-cases", () => {
    expect(cleanWord("  “Convenient.” ")).toBe("convenient");
    expect(cleanWord("Look   UP,")).toBe("look up");
    expect(cleanWord("don’t")).toBe("don't");
    expect(cleanWord("well-known")).toBe("well-known");
    expect(cleanWord("café")).toBe("café");
  });

  it("DIC-AC-01: rejects what cannot be a word", () => {
    for (const bad of ["", "   ", "...", "42", "a1b", "x".repeat(61), "a@b", null, undefined, 5]) {
      expect(cleanWord(bad)).toBeNull();
    }
  });

  it("DIC-AC-10: parseEntry keeps a good entry and drops a damaged one", () => {
    const good = { word: "a", ipa: null, audioUrl: null, meanings: [{ definition: "x", pos: null, example: null, vietnamese: true }], source: "ai" };
    expect(parseEntry(good)).toEqual(good);
    expect(parseEntry({ ...good, source: undefined })).toEqual({ ...good, source: "dictionary" });
    expect(parseEntry({ ...good, meanings: [] })).toEqual({ ...good, meanings: [] });
    expect(parseEntry({ ...good, meanings: [{ definition: "" }] })).toBeNull();
    expect(parseEntry("nope")).toBeNull();
  });

  it("DIC-AC-07: a word saved on its own has no meaning and the source manual", () => {
    expect(bareEntry("zzz")).toEqual({ word: "zzz", ipa: null, audioUrl: null, meanings: [], source: "manual" });
  });
});
