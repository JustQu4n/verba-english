import type { SentenceGrade } from "@/modules/writing/domain/sentence-grade";
import { normalizeAnswer } from "@/modules/writing/domain/sentence-answer";

export type GradeFailure = "unauthorized" | "not_found" | "invalid" | "no_credits" | "unavailable" | "unknown";

export type FeedbackState =
  | { status: "idle" }
  | { status: "grading" }
  /** `answer` is the normalized text that was graded. */
  | { status: "graded"; grade: SentenceGrade; answer: string; earned: number }
  | { status: "error"; reason: GradeFailure };

/** True when the feedback is about exactly what is in the box now. */
export function isGradedAnswer(feedback: FeedbackState, answer: string): boolean {
  return feedback.status === "graded" && feedback.answer === normalizeAnswer(answer);
}

/** The learner may move on only with an answer that was graded correct and has not been edited since. */
export function hasPassed(feedback: FeedbackState, answer: string): boolean {
  return feedback.status === "graded" && feedback.grade.correct && isGradedAnswer(feedback, answer);
}
