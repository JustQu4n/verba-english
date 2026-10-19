import { describe, expect, it } from "vitest";

import { sampleGrade } from "@/test/fakes";

import { suggestionVisible, type FeedbackState } from "./feedback-state";

const graded = (correct: boolean): FeedbackState => ({
  status: "graded",
  grade: sampleGrade({ correct }),
  answer: "I want to the beach",
  earned: 0,
  mode: "ai",
  source: "ai",
});

describe("suggestionVisible", () => {
  it("WSN-AC-19: a wrong answer shows the suggestion while the box still holds that answer (extra spaces aside)", () => {
    expect(suggestionVisible(graded(false), "I want to the beach")).toBe(true);
    expect(suggestionVisible(graded(false), "  I  want to the   beach ")).toBe(true);
  });

  it("WSN-AC-19: editing the box after a wrong answer hides the suggestion, and restoring the text brings it back", () => {
    expect(suggestionVisible(graded(false), "I want to go the beach")).toBe(false);
    expect(suggestionVisible(graded(false), "")).toBe(false);
    expect(suggestionVisible(graded(false), "I want to the beach")).toBe(true);
  });

  it("WSN-AC-19: a correct answer always shows it, and there is nothing to show before a grade", () => {
    expect(suggestionVisible(graded(true), "anything else")).toBe(true);
    for (const feedback of [{ status: "idle" }, { status: "grading" }] as FeedbackState[]) {
      expect(suggestionVisible(feedback, "x")).toBe(false);
    }
  });
});
