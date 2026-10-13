import { z } from "zod";

import { NotFoundError, UnauthorizedError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import type { AuthService } from "@/modules/auth/application/auth-service";

import { CATEGORIES, LEVELS, type SentencePrompt } from "../domain/sentence-catalog";
import type { SentenceProgress } from "../domain/sentence-progress";
import { loadProgress, type ProgressDeps } from "./load-progress";

const MAX_SEEN = 200;

const nextSentenceSchema = z.object({
  level: z.enum(LEVELS),
  category: z.enum(CATEGORIES),
  seenIds: z.array(z.string().max(100)).max(MAX_SEEN).default([]),
});

interface Deps extends ProgressDeps {
  auth: AuthService;
  /** Injectable so tests are deterministic. */
  random?: () => number;
}

export interface NextSentenceOutcome {
  /** Null when the user has completed every sentence of the pair. */
  prompt: SentencePrompt | null;
  progress: SentenceProgress;
}

/**
 * Picks the next practice sentence for the chosen level and category.
 * Completed sentences never come back; among the rest, ones not seen in this session go first,
 * and skipped ones return once everything else was seen.
 */
export async function getNextSentence(
  { auth, prompts, progress, random = Math.random }: Deps,
  input: unknown
): Promise<NextSentenceOutcome> {
  const { level, category, seenIds } = parseOrThrow(nextSentenceSchema, input);
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");

  const loaded = await loadProgress({ prompts, progress }, user.id, { level, category });
  if (loaded.all.length === 0) throw new NotFoundError("No sentences for this level and category");
  if (loaded.remaining.length === 0) return { prompt: null, progress: loaded.progress };

  const seen = new Set(seenIds);
  const unseen = loaded.remaining.filter((p) => !seen.has(p.id));
  const candidates = unseen.length > 0 ? unseen : loaded.remaining;
  return {
    prompt: candidates[Math.min(Math.floor(random() * candidates.length), candidates.length - 1)],
    progress: loaded.progress,
  };
}
