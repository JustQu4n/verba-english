/** How many learners the board shows. */
export const LEADERBOARD_SIZE = 10;

/** One ranked learner as the store returns it. */
export interface RankedLearner {
  readonly userId: string;
  /** Null when the learner never set a name. */
  readonly name: string | null;
  readonly avatarUrl: string | null;
  readonly points: number;
  /** 1 is the best; learners with equal points share a rank. */
  readonly rank: number;
}

/** One row of the board as the page shows it. No user id leaves the server: `isMe` is enough. */
export interface LeaderboardEntry {
  readonly rank: number;
  readonly name: string | null;
  readonly avatarUrl: string | null;
  readonly points: number;
  readonly isMe: boolean;
}

export interface Leaderboard {
  readonly entries: LeaderboardEntry[];
  /** The signed-in learner's own standing; null when they have no points yet. */
  readonly me: { rank: number; points: number } | null;
}
