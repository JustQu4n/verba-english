import { UnauthorizedError } from "@/core/errors";
import type { AuthService } from "@/modules/auth/application/auth-service";

import { LEADERBOARD_SIZE, type Leaderboard } from "../domain/leaderboard";
import type { LeaderboardSource } from "./leaderboard-source";

/** The top learners plus the signed-in learner's own standing (read separately only when they are outside the top). */
export async function getLeaderboard({
  auth,
  leaderboard,
}: {
  auth: AuthService;
  leaderboard: LeaderboardSource;
}): Promise<Leaderboard> {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");

  const top = await leaderboard.top(LEADERBOARD_SIZE);
  const entries = top.map((l) => ({
    rank: l.rank,
    name: l.name,
    avatarUrl: l.avatarUrl,
    points: l.points,
    isMe: l.userId === user.id,
  }));

  const mine = top.find((l) => l.userId === user.id);
  const me = mine ? { rank: mine.rank, points: mine.points } : await leaderboard.standing(user.id);
  return { entries, me };
}
