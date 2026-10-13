import type { Category, Level, SentencePrompt } from "./sentence-catalog";

export const MAX_VIETNAMESE_LENGTH = 300;
export const MAX_HINT_LENGTH = 200;

/** A stored sentence prompt: the learner-facing fields plus publishing state and timestamps. */
export interface Prompt extends SentencePrompt {
  readonly published: boolean;
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
}
