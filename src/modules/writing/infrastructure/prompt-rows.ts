import type { Prompt } from "../domain/prompt";
import { isCategory, isLevel } from "../domain/sentence-catalog";

/** Columns read for admin screens. `difficulty` stores the level. */
export const PROMPT_COLUMNS = "id, difficulty, category, prompt_text, hint, is_published, created_at, updated_at";

export interface PromptRow {
  id: string;
  difficulty: string;
  category: string | null;
  prompt_text: string;
  hint: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
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
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
