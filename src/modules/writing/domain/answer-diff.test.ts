import { describe, expect, it } from "vitest";

import { diffAnswer } from "./answer-diff";

describe("diffAnswer", () => {
  it("WSN-AC-20: an identical answer is one unmarked piece (case and end punctuation aside)", () => {
    expect(diffAnswer("I like cats", "I like cats.")).toEqual([{ kind: "same", text: "I like cats" }]);
    expect(diffAnswer("i like cats", "I like cats")).toEqual([{ kind: "same", text: "i like cats" }]);
  });

  it("WSN-AC-20: a wrong word carries the word that belongs there", () => {
    expect(diffAnswer("I goed to school", "I went to school")).toEqual([
      { kind: "same", text: "I" },
      { kind: "wrong", text: "goed", fix: "went" },
      { kind: "same", text: "to school" },
    ]);
  });

  it("WSN-AC-20: a missing word is shown on its own, an extra word has no fix", () => {
    expect(diffAnswer("I want go to the beach", "I want to go to the beach")).toEqual([
      { kind: "same", text: "I want" },
      { kind: "missing", text: "to" },
      { kind: "same", text: "go to the beach" },
    ]);
    expect(diffAnswer("I really like cats", "I like cats")).toEqual([
      { kind: "same", text: "I" },
      { kind: "wrong", text: "really", fix: "" },
      { kind: "same", text: "like cats" },
    ]);
  });

  it("WSN-AC-20: the answer's own words, in order, can always be read back", () => {
    const parts = diffAnswer("She don't likes the movie yesterday", "She didn't like the movie yesterday");
    const back = parts.flatMap((p) => (p.kind === "missing" ? [] : [p.text])).join(" ");
    expect(back).toBe("She don't likes the movie yesterday");
  });

  it("WSN-AC-20: empty input does not throw", () => {
    expect(diffAnswer("", "Hello there")).toEqual([{ kind: "missing", text: "Hello there" }]);
    expect(diffAnswer("Hello", "")).toEqual([{ kind: "wrong", text: "Hello", fix: "" }]);
  });
});
