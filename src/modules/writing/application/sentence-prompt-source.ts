import type { Category, Level, SentencePrompt, SentenceSelection } from "../domain/sentence-catalog";

/** Where practice sentences come from. Named by meaning, not technology, so the source can change later. */
export interface SentencePromptSource {
  list(selection: SentenceSelection): Promise<SentencePrompt[]>;
  /** One published prompt by id, or null when it does not exist or is not published. */
  /** How many published prompts each category of a level has. Categories without any are left out. */
  countByCategory(level: Level): Promise<Partial<Record<Category, number>>>;
  get(id: string): Promise<SentencePrompt | null>;
}
