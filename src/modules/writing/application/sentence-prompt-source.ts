import type { SentencePrompt, SentenceSelection } from "../domain/sentence-catalog";

/** Where practice sentences come from. Named by meaning, not technology, so the source can change later. */
export interface SentencePromptSource {
  list(selection: SentenceSelection): Promise<SentencePrompt[]>;
}
