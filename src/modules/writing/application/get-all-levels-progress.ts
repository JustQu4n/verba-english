import { UnauthorizedError } from "@/core/errors";
import type { AuthService } from "@/modules/auth/application/auth-service";

import { CATEGORIES, LEVELS, type Category, type Level } from "../domain/sentence-catalog";
import type { AllLevelsProgress, LevelProgress } from "../domain/sentence-progress";
import type { ProgressDeps } from "./load-progress";

async function levelProgress(
  { prompts, progress }: ProgressDeps,
  userId: string,
  level: Level
): Promise<LevelProgress> {
  const [totals, done] = await Promise.all([prompts.countByCategory(level), progress.completedByCategory(userId, level)]);
  return Object.fromEntries(
    CATEGORIES.map((category: Category) => {
      const total = totals[category] ?? 0;
      // A counter can briefly exceed the published total (an admin unpublished a prompt); never show more than the total.
      return [category, { completed: Math.min(done[category] ?? 0, total), total }];
    })
  ) as LevelProgress;
}

/** Progress of the signed-in user in every category of every level, in one go (for the choose screen). */
export async function getAllLevelsProgress({ auth, prompts, progress }: ProgressDeps & { auth: AuthService }): Promise<AllLevelsProgress> {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  const perLevel = await Promise.all(LEVELS.map((level) => levelProgress({ prompts, progress }, user.id, level)));
  return Object.fromEntries(LEVELS.map((level, index) => [level, perLevel[index]])) as AllLevelsProgress;
}
