import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { createAdminClient } from "@/infrastructure/supabase/admin";
import type { LeaderboardSource } from "@/modules/leaderboard/application/leaderboard-source";
import type { RankedLearner } from "@/modules/leaderboard/domain/leaderboard";
import { SupabaseLeaderboardSource } from "@/modules/leaderboard/infrastructure/supabase-leaderboard-source";
import type { SentencePromptSource } from "@/modules/writing/application/sentence-prompt-source";
import type { Category, Level, SentenceSelection } from "@/modules/writing/domain/sentence-catalog";
import { SupabaseSentencePromptSource } from "@/modules/writing/infrastructure/supabase-sentence-prompt-source";

/**
 * Reads that every learner shares and that change slowly, kept in the platform's shared cache (`use cache: remote`)
 * so that one database query serves all server instances. They use the service role because a cached read cannot
 * depend on the signed-in user (cookies), and only public data goes through here: the top of the ranking and how many
 * published sentences each category has. Everything personal (own rank, progress) is still read live.
 *
 * Tags: "leaderboard" (names, pictures and points change it) and "prompts" (the admin changes published sentences).
 * Server Actions that change that data call `updateTag` so the owner of the change sees it at once.
 */
export const LEADERBOARD_TAG = "leaderboard";
export const PROMPTS_TAG = "prompts";

async function readTop(limit: number): Promise<RankedLearner[]> {
  "use cache: remote";
  cacheLife({ stale: 30, revalidate: 60, expire: 600 });
  cacheTag(LEADERBOARD_TAG);
  return new SupabaseLeaderboardSource(createAdminClient).top(limit);
}

async function readCounts(level: Level): Promise<Partial<Record<Category, number>>> {
  "use cache: remote";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  cacheTag(PROMPTS_TAG);
  return new SupabaseSentencePromptSource(createAdminClient()).countByCategory(level);
}

/** The top of the ranking comes from the shared cache (at most a minute old); one learner's own standing is read live. */
export class CachedLeaderboardSource implements LeaderboardSource {
  private readonly inner: LeaderboardSource;

  constructor(inner: LeaderboardSource) {
    this.inner = inner;
  }

  top(limit: number): Promise<RankedLearner[]> {
    return readTop(limit);
  }

  standing(userId: string) {
    return this.inner.standing(userId);
  }
}

/** Category totals come from the shared cache; the sentences themselves are read live. */
export class CachedPromptSource implements SentencePromptSource {
  private readonly inner: SentencePromptSource;

  constructor(inner: SentencePromptSource) {
    this.inner = inner;
  }

  list(selection: SentenceSelection) {
    return this.inner.list(selection);
  }

  get(id: string) {
    return this.inner.get(id);
  }

  async countByCategory(level: Level) {
    try {
      return await readCounts(level);
    } catch (error) {
      unstable_rethrow(error);
      // No service key (or the cache is down): the totals are still available through the learner's own session.
      console.error("Cached category counts unavailable, reading directly");
      return this.inner.countByCategory(level);
    }
  }
}
