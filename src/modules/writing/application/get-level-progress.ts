import { z } from "zod";

import { UnauthorizedError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import type { AuthService } from "@/modules/auth/application/auth-service";

import { CATEGORIES, LEVELS, type Category } from "../domain/sentence-catalog";
import type { SentenceProgress } from "../domain/sentence-progress";
import type { ProgressDeps } from "./load-progress";

const schema = z.object({ level: z.enum(LEVELS) });

export type LevelProgress = Record<Category, SentenceProgress>;

/** Progress of the signed-in user in every category of one level (for the choose screen). */
export async function getLevelProgress(
  { auth, prompts, progress }: ProgressDeps & { auth: AuthService },
  input: unknown
): Promise<LevelProgress> {
  const { level } = parseOrThrow(schema, input);
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  const [totals, done] = await Promise.all([prompts.countByCategory(level), progress.completedByCategory(user.id, level)]);
  return Object.fromEntries(
    CATEGORIES.map((category) => {
      const total = totals[category] ?? 0;
      // A counter can briefly exceed the published total (an admin unpublished a prompt); never show more than the total.
      return [category, { completed: Math.min(done[category] ?? 0, total), total }];
    })
  ) as LevelProgress;
}
