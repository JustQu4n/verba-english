import { describe, expect, it } from "vitest";

import { canSubmitAnswer, MAX_ANSWER_LENGTH } from "./sentence-answer";

describe("canSubmitAnswer", () => {
  it.each(["", "   ", "\n\t "])("WSN-AC-09: rejects blank answer %j", (text) => {
    expect(canSubmitAnswer(text)).toBe(false);
  });

  it("WSN-AC-09: accepts an answer with content", () => {
    expect(canSubmitAnswer("I wake up at six.")).toBe(true);
  });

  it("WSN-AC-10: accepts exactly the maximum length and rejects one more", () => {
    expect(MAX_ANSWER_LENGTH).toBe(300);
    expect(canSubmitAnswer("a".repeat(300))).toBe(true);
    expect(canSubmitAnswer("a".repeat(301))).toBe(false);
  });

  it("WSN-AC-10: ignores surrounding whitespace when counting", () => {
    expect(canSubmitAnswer(`  ${"a".repeat(300)}  `)).toBe(true);
  });
});
