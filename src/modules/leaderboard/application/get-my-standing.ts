import { UnauthorizedError } from "@/core/errors";
import type { AuthService } from "@/modules/auth/application/auth-service";

import type { LeaderboardSource } from "./leaderboard-source";

/** The signed-in learner's own rank and points; null while they have no points. */
export async function getMyStanding({
  auth,
  leaderboard,
}: {
  auth: AuthService;
  leaderboard: LeaderboardSource;
}): Promise<{ rank: number; points: number } | null> {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  return leaderboard.standing(user.id);
}
