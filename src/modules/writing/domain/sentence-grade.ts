/** Result of grading one answer. `improvements` and `comment` are written for the learner (Vietnamese). */
export interface SentenceGrade {
  correct: boolean;
  /** One natural English sentence. For a correct answer, the answer itself. */
  suggestion: string;
  /** Short notes on what to fix. Empty when the answer is correct. */
  improvements: string[];
  comment: string;
}

export const MAX_IMPROVEMENTS = 2;

/** Language of the notes and comment: follows the interface language. */
export type FeedbackLanguage = "vi" | "en";
