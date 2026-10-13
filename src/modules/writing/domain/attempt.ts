import type { GradingMode } from "./grading-mode";
import type { FeedbackLanguage } from "./sentence-grade";

/** Who produced the verdict of an attempt. */
export type GradeSource = "ai" | "reference";

/** One graded attempt, as it is written. */
export interface NewAttempt {
  userId: string;
  promptId: string;
  mode: GradingMode;
  correct: boolean;
  /** What the learner wrote (trimmed). */
  answer: string;
  /** The answer ignoring case, punctuation and spacing: the same key to the same sentence is the same attempt. */
  answerKey: string;
  source: GradeSource;
  language: FeedbackLanguage;
  suggestion: string;
  improvements: string[];
  comment: string;
}

/** One graded attempt, as it is shown in the history. */
export interface AttemptRecord {
  id: string;
  /** The Vietnamese sentence; null when the prompt is no longer published. */
  vietnamese: string | null;
  mode: GradingMode;
  correct: boolean;
  answer: string;
  source: GradeSource;
  suggestion: string;
  improvements: string[];
  comment: string;
  /** How many times this same answer was sent. */
  tries: number;
  /** When it was last sent. */
  createdAt: Date;
}
