import { z } from "zod";

import { MAX_HINT_LENGTH, MAX_VIETNAMESE_LENGTH, type PromptDraft } from "../domain/prompt";
import { CATEGORIES, LEVELS } from "../domain/sentence-catalog";

/** Codes the admin form translates; zod messages are these codes, never display text. */
export const PROMPT_ERROR_CODES = [
  "vietnamese_required",
  "vietnamese_too_long",
  "hint_required",
  "hint_too_long",
  "level_invalid",
  "category_invalid",
] as const;

export const promptInputSchema = z.object({
  level: z.enum(LEVELS, { error: "level_invalid" }),
  category: z.enum(CATEGORIES, { error: "category_invalid" }),
  vietnamese: z
    .string({ error: "vietnamese_required" })
    .trim()
    .min(1, "vietnamese_required")
    .max(MAX_VIETNAMESE_LENGTH, "vietnamese_too_long"),
  hint: z
    .string({ error: "hint_required" })
    .trim()
    .min(1, "hint_required")
    .max(MAX_HINT_LENGTH, "hint_too_long"),
  published: z.boolean().optional().default(false),
}) satisfies z.ZodType<PromptDraft, unknown>;

const UUID = z.uuid();

/** A malformed id can never match a row, so callers treat it as "not found" instead of querying. */
export const isPromptId = (id: string): boolean => UUID.safeParse(id).success;
