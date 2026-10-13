import { z } from "zod";

import { MAX_ACCEPTED_ANSWERS, MAX_ANSWER_TEXT_LENGTH, MAX_STRUCTURE_LENGTH } from "../domain/accepted-answer";
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
  "answer_required",
  "answer_too_long",
  "structure_too_long",
  "answers_too_many",
] as const;

const structureSchema = z.string().trim().max(MAX_STRUCTURE_LENGTH, "structure_too_long").default("");

export const acceptedAnswerSchema = z.object({
  text: z
    .string({ error: "answer_required" })
    .trim()
    .min(1, "answer_required")
    .max(MAX_ANSWER_TEXT_LENGTH, "answer_too_long"),
  structureVi: structureSchema,
  structureEn: structureSchema,
});

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
  answers: z.array(acceptedAnswerSchema).max(MAX_ACCEPTED_ANSWERS, "answers_too_many").optional().default([]),
}) satisfies z.ZodType<PromptDraft, unknown>;

const UUID = z.uuid();

/** A malformed id can never match a row, so callers treat it as "not found" instead of querying. */
export const isPromptId = (id: string): boolean => UUID.safeParse(id).success;
