import { InfrastructureError } from "@/core/errors";

import type { AnswerSuggester, SuggestionRequest } from "../application/answer-suggester";
import type { AcceptedAnswer } from "../domain/accepted-answer";
import { generateJson, type GeminiOptions } from "./gemini-client";
import {
  buildSuggestionInput,
  parseSuggestions,
  SUGGESTION_SCHEMA,
  SUGGESTION_SYSTEM_INSTRUCTION,
} from "./gemini-suggestion-prompt";

/** Three answers with two short notes each fit well inside this. */
const MAX_OUTPUT_TOKENS = 1200;

/** Drafts accepted answers with Gemini. Used from the admin form only, so it costs the owner's quota, not learners' credits. */
export class GeminiAnswerSuggester implements AnswerSuggester {
  private readonly options: GeminiOptions;

  constructor(options: GeminiOptions) {
    this.options = options;
  }

  async suggest(request: SuggestionRequest): Promise<AcceptedAnswer[]> {
    const text = await generateJson(this.options, {
      system: SUGGESTION_SYSTEM_INSTRUCTION,
      input: buildSuggestionInput(request),
      schema: SUGGESTION_SCHEMA,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    const answers = parseSuggestions(text);
    if (!answers) throw new InfrastructureError("Gemini returned an unusable reply");
    return answers;
  }
}
