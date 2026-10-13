import { describe, expect, it } from "vitest";

import { answerKey, closestAnswer, findMatchingAnswer, structureNotes, type AcceptedAnswer } from "./accepted-answer";

const go: AcceptedAnswer = {
  text: "I want to go to the beach.",
  structureVi: "want to + V: muốn làm gì\n\n go to + nơi chốn ",
  structureEn: "want to + verb",
};
const like: AcceptedAnswer = { text: "I'd like to go to the beach.", structureVi: "", structureEn: "" };

describe("accepted answers", () => {
  it("ANS-AC-01: ignores case, punctuation, spaces and quote style", () => {
    expect(answerKey("  I WANT  to go, to the beach!! ")).toBe(answerKey("i want to go to the beach."));
    expect(answerKey("I’d like")).toBe(answerKey("I'd like"));
  });

  it("ANS-AC-01: different words are different answers", () => {
    expect(answerKey("I want to go to the beach")).not.toBe(answerKey("I want to the beach"));
    expect(answerKey("I'm here")).not.toBe(answerKey("I am here"));
  });

  it("ANS-AC-02: finds the first matching answer", () => {
    expect(findMatchingAnswer([like, go], "i want to go to the beach")).toBe(go);
    expect(findMatchingAnswer([like, go], "I'd like to go to the beach!")).toBe(like);
  });

  it("ANS-AC-02: no match, empty input or empty list gives null", () => {
    expect(findMatchingAnswer([go], "I go to the beach")).toBeNull();
    expect(findMatchingAnswer([go], "  ...  ")).toBeNull();
    expect(findMatchingAnswer([], "I want to go to the beach")).toBeNull();
  });

  it("ANS-AC-03: notes follow the language, one per non-empty line", () => {
    expect(structureNotes(go, "vi")).toEqual(["want to + V: muốn làm gì", "go to + nơi chốn"]);
    expect(structureNotes(go, "en")).toEqual(["want to + verb"]);
    expect(structureNotes(like, "vi")).toEqual([]);
  });

  it("ANS-AC-23: picks the answer sharing the most words, the earlier one on a tie", () => {
    expect(closestAnswer([go, like], "I'd like to go beach")).toBe(like);
    expect(closestAnswer([like, go], "I want go beach")).toBe(go);
    expect(closestAnswer([go, like], "completely different")).toBe(go);
  });

  it("ANS-AC-23: no answers gives null", () => {
    expect(closestAnswer([], "anything")).toBeNull();
  });
});
