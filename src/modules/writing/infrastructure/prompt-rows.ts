import type { AcceptedAnswer } from "../domain/accepted-answer";
import type { Prompt } from "../domain/prompt";
import { isCategory, isLevel } from "../domain/sentence-catalog";

/** Columns read for admin screens. `difficulty` stores the level. */
export const PROMPT_COLUMNS = "id, difficulty, category, prompt_text, hint, is_published, created_at, updated_at, prompt_answers(answers)";

export interface PromptRow {
  id: string;
  difficulty: string;
  category: string | null;
  prompt_text: string;
  hint: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  /** Embedded one-to-one row; null or absent when the prompt has no accepted answers. */
  prompt_answers?: { answers: unknown } | null;
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

/** Reads the stored jsonb defensively: anything that is not an answer with text is dropped. */
export function parseAnswers(value: unknown): AcceptedAnswer[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const { text: answer, structureVi, structureEn } = item as Record<string, unknown>;
    return text(answer).trim() === ""
      ? []
      : [{ text: text(answer), structureVi: text(structureVi), structureEn: text(structureEn) }];
  });
}

/** Null when the row is not a valid sentence prompt (e.g. unknown level, or no category). */
export function toPrompt(row: PromptRow): Prompt | null {
  if (!isLevel(row.difficulty) || !isCategory(row.category)) return null;
  return {
    id: row.id,
    level: row.difficulty,
    category: row.category,
    vietnamese: row.prompt_text,
    hint: row.hint ?? "",
    published: row.is_published,
    answers: parseAnswers(row.prompt_answers?.answers),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
