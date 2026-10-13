import type { FeedbackLanguage, SentenceGrade } from "../domain/sentence-grade";
import type { Level } from "../domain/sentence-catalog";

export interface GradingRequest {
  /** The Vietnamese source sentence, taken from the stored prompt (never from the browser). */
  vietnamese: string;
  level: Level;
  answer: string;
  /** Language for the improvements and the comment. */
  language: FeedbackLanguage;
}

/** Judges an English answer to a Vietnamese sentence. Implementations may call an AI service. */
export interface SentenceGrader {
  grade(request: GradingRequest): Promise<SentenceGrade>;
}
