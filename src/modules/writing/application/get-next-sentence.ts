import { z } from "zod";

import { NotFoundError, UnauthorizedError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import type { AuthService } from "@/modules/auth/application/auth-service";

import { CATEGORIES, LEVELS, type SentencePrompt } from "../domain/sentence-catalog";
import type { SentencePromptSource } from "./sentence-prompt-source";

const MAX_SEEN = 200;

const nextSentenceSchema = z.object({
  level: z.enum(LEVELS),
  category: z.enum(CATEGORIES),
  seenIds: z.array(z.string().max(100)).max(MAX_SEEN).default([]),
});

interface Deps {
  auth: AuthService;
  prompts: SentencePromptSource;
  /** Injectable so tests are deterministic. */
  random?: () => number;
}

/** Picks the next practice sentence for the chosen level and category, preferring ones not seen yet. */
export async function getNextSentence(
  { auth, prompts, random = Math.random }: Deps,
  input: unknown
): Promise<SentencePrompt> {
  const { level, category, seenIds } = parseOrThrow(nextSentenceSchema, input);
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");

  const all = await prompts.list({ level, category });
  if (all.length === 0) throw new NotFoundError("No sentences for this level and category");

  const seen = new Set(seenIds);
  const unseen = all.filter((p) => !seen.has(p.id));
  const candidates = unseen.length > 0 ? unseen : all;
  return candidates[Math.min(Math.floor(random() * candidates.length), candidates.length - 1)];
}
