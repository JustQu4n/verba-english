import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";
import { safeAvatarUrl } from "@/lib/profile-display";

import type { LeaderboardSource } from "../application/leaderboard-source";
import type { RankedLearner } from "../domain/leaderboard";

interface TopRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
  rank: number;
}

interface StandingRow {
  points: number;
  rank: number;
}

/**
 * Reads the ranking through the database functions leaderboard_top and leaderboard_rank. Other learners' rows are
 * not readable by a user session, so a privileged client is created only when a read happens (service role).
 */
export class SupabaseLeaderboardSource implements LeaderboardSource {
  private readonly createReader: () => SupabaseClient;

  constructor(createReader: () => SupabaseClient) {
    this.createReader = createReader;
  }

  private reader(): SupabaseClient {
    try {
      return this.createReader();
    } catch (error) {
      throw new InfrastructureError("Could not read the leaderboard", { cause: error });
    }
  }

  async top(limit: number): Promise<RankedLearner[]> {
    const { data, error } = await this.reader().rpc("leaderboard_top", { p_limit: limit });
    if (error) throw new InfrastructureError("Could not read the leaderboard", { cause: error });
    return ((data as TopRow[] | null) ?? []).map((row) => ({
      userId: row.user_id,
      name: row.full_name?.trim() || null,
      avatarUrl: safeAvatarUrl(row.avatar_url),
      points: row.points,
      rank: row.rank,
    }));
  }

  async standing(userId: string): Promise<{ rank: number; points: number } | null> {
    const { data, error } = await this.reader().rpc("leaderboard_rank", { p_user_id: userId });
    if (error) throw new InfrastructureError("Could not read the leaderboard", { cause: error });
    const row = (data as StandingRow[] | null)?.[0];
    return row ? { rank: row.rank, points: row.points } : null;
  }
}
