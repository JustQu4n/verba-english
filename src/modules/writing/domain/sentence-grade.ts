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

/** Language of the notes and comment. */
export type FeedbackLanguage = "vi" | "en";

/** Feedback is always in Vietnamese, whatever the interface language: the learners are Vietnamese. */
export const FEEDBACK_LANGUAGE: FeedbackLanguage = "vi";
