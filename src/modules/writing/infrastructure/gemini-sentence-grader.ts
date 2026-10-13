import type { GradingRequest, SentenceGrader } from "../application/sentence-grader";
import type { SentenceGrade } from "../domain/sentence-grade";
import { InfrastructureError } from "@/core/errors";

import { generateJson, type GeminiOptions } from "./gemini-client";
import { buildGradingInput, GRADE_SCHEMA, parseGrade, SYSTEM_INSTRUCTION } from "./gemini-grading-prompt";

/** A grade is about 100 tokens. */
const MAX_OUTPUT_TOKENS = 600;

export type GeminiGraderOptions = GeminiOptions;

/** Grades with Gemini: one short request, JSON back. */
export class GeminiSentenceGrader implements SentenceGrader {
  private readonly options: GeminiGraderOptions;

  constructor(options: GeminiGraderOptions) {
    this.options = options;
  }

  async grade(request: GradingRequest): Promise<SentenceGrade> {
    const text = await generateJson(this.options, {
      system: SYSTEM_INSTRUCTION,
      input: buildGradingInput(request),
      schema: GRADE_SCHEMA,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    const grade = parseGrade(text);
    if (!grade) throw new InfrastructureError("Gemini returned an unusable reply");
    return grade;
  }
}
