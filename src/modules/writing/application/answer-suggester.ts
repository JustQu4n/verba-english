import type { AcceptedAnswer } from "../domain/accepted-answer";
import type { Level } from "../domain/sentence-catalog";

export interface SuggestionRequest {
  vietnamese: string;
  level: Level;
  /** English key words the admin already wrote; helps the AI pick the intended wording. */
  hint: string;
}

/** What the AI drafts for one prompt: accepted answers with grammar notes, and the key words shown as the learner's hint. */
export interface Suggestion {
  answers: AcceptedAnswer[];
  keywords: string[];
}

/** Drafts a suggestion for the admin to review. Implementations may call an AI service. */
export interface AnswerSuggester {
  suggest(request: SuggestionRequest): Promise<Suggestion>;
}
