import type { AcceptedAnswer } from "./accepted-answer";
import type { Category, Level, SentencePrompt } from "./sentence-catalog";

export const MAX_VIETNAMESE_LENGTH = 300;
export const MAX_HINT_LENGTH = 200;

/** A stored sentence prompt: the learner-facing fields plus publishing state and timestamps. */
export interface Prompt extends SentencePrompt {
  readonly published: boolean;
  /** Correct translations with grammar notes; empty when the prompt has none. */
  readonly answers: readonly AcceptedAnswer[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** What an admin edits. */
export interface PromptDraft {
  readonly level: Level;
  readonly category: Category;
  readonly vietnamese: string;
  readonly hint: string;
  readonly published: boolean;
  readonly answers: readonly AcceptedAnswer[];
}
