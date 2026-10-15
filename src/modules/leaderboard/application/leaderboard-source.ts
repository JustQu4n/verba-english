import type { RankedLearner } from "../domain/leaderboard";

/** Where the ranking is read from. */
export interface LeaderboardSource {
  /** The best `limit` learners, best first. Learners without points are not ranked. */
  top(limit: number): Promise<RankedLearner[]>;
  /** One learner's rank and points; null when they have no points. */
  standing(userId: string): Promise<{ rank: number; points: number } | null>;
}
