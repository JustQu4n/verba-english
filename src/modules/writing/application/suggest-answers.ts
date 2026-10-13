import { z } from "zod";

import { parseOrThrow } from "@/core/validate";
import { requireAdmin } from "@/modules/admin/application/require-admin";

import { MAX_HINT_LENGTH, MAX_VIETNAMESE_LENGTH } from "../domain/prompt";
import type { AcceptedAnswer } from "../domain/accepted-answer";
import { LEVELS } from "../domain/sentence-catalog";
import type { AnswerSuggester } from "./answer-suggester";
import type { PromptAdminDeps } from "./prompt-admin-deps";

/** The admin reviews every suggestion, so a short list is enough. */
export const MAX_SUGGESTIONS = 3;

const suggestSchema = z.object({
  vietnamese: z.string().trim().min(1, "vietnamese_required").max(MAX_VIETNAMESE_LENGTH, "vietnamese_too_long"),
  level: z.enum(LEVELS, { error: "level_invalid" }),
  hint: z.string().trim().max(MAX_HINT_LENGTH, "hint_too_long").optional().default(""),
});

/** Asks the AI to draft accepted answers and grammar notes. Admin only; nothing is saved here. */
export async function suggestAnswers(
  deps: PromptAdminDeps & { suggester: AnswerSuggester },
  input: unknown
): Promise<AcceptedAnswer[]> {
  await requireAdmin(deps);
  const request = parseOrThrow(suggestSchema, input);
  const answers = await deps.suggester.suggest(request);
  return answers.slice(0, MAX_SUGGESTIONS);
}
