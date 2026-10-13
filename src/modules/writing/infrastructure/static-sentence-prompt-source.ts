import type { SentencePromptSource } from "../application/sentence-prompt-source";
import type { SentencePrompt, SentenceSelection } from "../domain/sentence-catalog";
import { SENTENCE_PROMPTS } from "./sentence-prompts";

/** In-memory source backed by the sample bank. Swap for a database-backed source without touching callers. */
export class StaticSentencePromptSource implements SentencePromptSource {
  async list({ level, category }: SentenceSelection): Promise<SentencePrompt[]> {
    return SENTENCE_PROMPTS.filter((p) => p.level === level && p.category === category);
  }
}
