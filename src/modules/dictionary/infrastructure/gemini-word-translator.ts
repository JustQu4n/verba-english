import { InfrastructureError } from "@/core/errors";
import { generateJson, type GeminiOptions } from "@/modules/writing/infrastructure/gemini-client";

import type { WordTranslator } from "../application/ports";
import type { DictionaryEntry } from "../domain/dictionary-entry";
import { buildWordInput, parseWordReply, WORD_SCHEMA, WORD_SYSTEM_INSTRUCTION } from "./gemini-word-prompt";

/** Three short meanings with an example each fit well inside this. */
const MAX_OUTPUT_TOKENS = 700;

/** Writes the meaning of a word with Gemini. The learner pays for it in credits (see translateWord). */
export class GeminiWordTranslator implements WordTranslator {
  private readonly options: GeminiOptions;

  constructor(options: GeminiOptions) {
    this.options = options;
  }

  async translate(word: string): Promise<DictionaryEntry> {
    const text = await generateJson(this.options, {
      system: WORD_SYSTEM_INSTRUCTION,
      input: buildWordInput(word),
      schema: WORD_SCHEMA,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    const entry = parseWordReply(text, word);
    if (!entry) throw new InfrastructureError("Gemini returned an unusable reply");
    return entry;
  }
}
