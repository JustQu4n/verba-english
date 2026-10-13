import { z } from "zod";

import { UnauthorizedError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import type { AuthService } from "@/modules/auth/application/auth-service";

import { CATEGORIES, LEVELS } from "../domain/sentence-catalog";
import type { SentenceProgress } from "../domain/sentence-progress";
import { loadProgress, type ProgressDeps } from "./load-progress";

const schema = z.object({ level: z.enum(LEVELS), category: z.enum(CATEGORIES) });

/** Progress of the signed-in user in one level and category. */
export async function getSentenceProgress(
  { auth, prompts, progress }: ProgressDeps & { auth: AuthService },
  input: unknown
): Promise<SentenceProgress> {
  const selection = parseOrThrow(schema, input);
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  return (await loadProgress({ prompts, progress }, user.id, selection)).progress;
}
