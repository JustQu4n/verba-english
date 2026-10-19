import type { SentenceGrade } from "@/modules/writing/domain/sentence-grade";
import type { GradingMode } from "@/modules/writing/domain/grading-mode";
import { normalizeAnswer } from "@/modules/writing/domain/sentence-answer";

export type GradeFailure = "unauthorized" | "not_found" | "invalid" | "no_credits" | "unavailable" | "unknown";

export type FeedbackState =
  | { status: "idle" }
  | { status: "grading" }
  /** `answer` is the normalized text that was graded. */
  | { status: "graded"; grade: SentenceGrade; answer: string; earned: number; mode: GradingMode; source: "ai" | "reference" }
  | { status: "error"; reason: GradeFailure; mode: GradingMode };

/**
 * True when the feedback is about exactly what is in the box now.
 * With `mode`, also the same way of checking: the same text may be sent again to be checked the other way.
 */
export function isGradedAnswer(feedback: FeedbackState, answer: string, mode?: GradingMode): boolean {
  return (
    feedback.status === "graded" &&
    feedback.answer === normalizeAnswer(answer) &&
    (mode === undefined || feedback.mode === mode)
  );
}

/**
 * Whether the suggested answer may be shown next to the feedback. A wrong answer keeps it until the learner starts
 * editing the box: then the suggestion is hidden, so the next try comes from them and not from copying it.
 * A correct answer always shows it (the box is locked and there is nothing left to try).
 */
export function suggestionVisible(feedback: FeedbackState, answer: string): boolean {
  return feedback.status === "graded" && (feedback.grade.correct || feedback.answer === normalizeAnswer(answer));
}

/** The learner may move on only with an answer that was graded correct and has not been edited since. */
export function hasPassed(feedback: FeedbackState, answer: string): boolean {
  return feedback.status === "graded" && feedback.grade.correct && isGradedAnswer(feedback, answer);
}
