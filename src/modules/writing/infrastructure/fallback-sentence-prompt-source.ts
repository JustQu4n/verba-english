import type { SentencePromptSource } from "../application/sentence-prompt-source";
import type { SentencePrompt, SentenceSelection } from "../domain/sentence-catalog";

/** Uses `fallback` only when `primary` has nothing for the pair. Errors from `primary` are not hidden. */
export class FallbackSentencePromptSource implements SentencePromptSource {
  private readonly primary: SentencePromptSource;
  private readonly fallback: SentencePromptSource;

  constructor(primary: SentencePromptSource, fallback: SentencePromptSource) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async list(selection: SentenceSelection): Promise<SentencePrompt[]> {
    const items = await this.primary.list(selection);
    return items.length > 0 ? items : this.fallback.list(selection);
  }
}
