import { InfrastructureError } from "@/core/errors";

import type { GradingRequest, SentenceGrader } from "../application/sentence-grader";
import type { SentenceGrade } from "../domain/sentence-grade";
import { buildGradingInput, GRADE_SCHEMA, parseGrade, SYSTEM_INSTRUCTION } from "./gemini-grading-prompt";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
/** A grade is about 100 tokens. The cap leaves room for a little thinking without allowing a runaway reply. */
const MAX_OUTPUT_TOKENS = 600;
const TIMEOUT_MS = 20_000;

export interface GeminiGraderOptions {
  /** Server-only key. When missing, grading fails with an infrastructure error instead of calling out. */
  apiKey: string | undefined;
  model: string;
  /** Lowest reasoning level the model accepts: thinking tokens are billed. */
  thinkingLevel: string;
  fetch?: typeof fetch;
}

interface Part {
  type?: string;
  text?: string;
}

/** Pulls the model's text out of an Interactions reply (steps) or a generateContent reply (candidates). */
function extractText(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const { steps, candidates, status } = body as {
    steps?: { type?: string; content?: Part[] }[];
    candidates?: { content?: { parts?: Part[] } }[];
    status?: string;
  };
  if (status !== undefined && status !== "completed") return null;
  const parts: Part[] = Array.isArray(steps)
    ? steps.filter((s) => s?.type === "model_output").flatMap((s) => s.content ?? [])
    : (candidates?.[0]?.content?.parts ?? []);
  const text = parts
    .filter((p) => p?.type === undefined || p.type === "text")
    .map((p) => (typeof p?.text === "string" ? p.text : ""))
    .join("");
  return text.trim() === "" ? null : text;
}

/** Grades with Gemini through the Interactions API: one short request, JSON back, nothing stored on Google's side. */
export class GeminiSentenceGrader implements SentenceGrader {
  private readonly options: GeminiGraderOptions;

  constructor(options: GeminiGraderOptions) {
    this.options = options;
  }

  async grade(request: GradingRequest): Promise<SentenceGrade> {
    const { apiKey, model, thinkingLevel } = this.options;
    if (!apiKey) throw new InfrastructureError("Gemini is not configured");

    let response: Response;
    try {
      response = await (this.options.fetch ?? fetch)(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          model,
          system_instruction: SYSTEM_INSTRUCTION,
          input: buildGradingInput(request),
          store: false,
          generation_config: { max_output_tokens: MAX_OUTPUT_TOKENS, thinking_level: thinkingLevel },
          response_format: { type: "text", mime_type: "application/json", schema: GRADE_SCHEMA },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      throw new InfrastructureError("Gemini request failed", { cause: error });
    }

    // Only the status is reported: the body can echo the request, which holds the learner's text.
    if (!response.ok) throw new InfrastructureError(`Gemini answered with status ${response.status}`);

    const text = extractText(await response.json().catch(() => null));
    const grade = text === null ? null : parseGrade(text);
    if (!grade) throw new InfrastructureError("Gemini returned an unusable reply");
    return grade;
  }
}
