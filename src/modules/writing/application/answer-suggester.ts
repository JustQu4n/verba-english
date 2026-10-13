import type { AcceptedAnswer } from "../domain/accepted-answer";
import type { Level } from "../domain/sentence-catalog";

export interface SuggestionRequest {
  vietnamese: string;
  level: Level;
  /** English key words the admin already wrote; helps the AI pick the intended wording. */
  hint: string;
}

/** Drafts accepted answers with grammar notes for the admin to review. Implementations may call an AI service. */
export interface AnswerSuggester {
  suggest(request: SuggestionRequest): Promise<AcceptedAnswer[]>;
}
