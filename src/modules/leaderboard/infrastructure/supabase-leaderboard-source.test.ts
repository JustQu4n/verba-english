import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { SupabaseLeaderboardSource } from "./supabase-leaderboard-source";

function source(result: unknown) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { store: new SupabaseLeaderboardSource(() => ({ rpc }) as unknown as SupabaseClient), rpc };
}

describe("SupabaseLeaderboardSource", () => {
  it("LDB-AC-05: calls leaderboard_top and maps rows (trimmed name, https avatar only)", async () => {
    const { store, rpc } = source({
      data: [
        { user_id: "u1", full_name: "  An  ", avatar_url: "https://x.test/a.png", points: 90, rank: 1 },
        { user_id: "u2", full_name: "   ", avatar_url: "http://x.test/b.png", points: 80, rank: 2 },
      ],
      error: null,
    });
    await expect(store.top(10)).resolves.toEqual([
      { userId: "u1", name: "An", avatarUrl: "https://x.test/a.png", points: 90, rank: 1 },
      { userId: "u2", name: null, avatarUrl: null, points: 80, rank: 2 },
    ]);
    expect(rpc).toHaveBeenCalledWith("leaderboard_top", { p_limit: 10 });
  });

  it("LDB-AC-05: an error or a missing service key is an infrastructure error", async () => {
    await expect(source({ data: null, error: { message: "boom" } }).store.top(10)).rejects.toBeInstanceOf(InfrastructureError);
    const noKey = new SupabaseLeaderboardSource(() => {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    });
    await expect(noKey.top(10)).rejects.toBeInstanceOf(InfrastructureError);
  });

  it("LDB-AC-06: reads one standing through leaderboard_rank; no row is null; an error is infrastructure", async () => {
    const found = source({ data: [{ points: 30, rank: 14 }], error: null });
    await expect(found.store.standing("u9")).resolves.toEqual({ rank: 14, points: 30 });
    expect(found.rpc).toHaveBeenCalledWith("leaderboard_rank", { p_user_id: "u9" });
    await expect(source({ data: [], error: null }).store.standing("u9")).resolves.toBeNull();
    await expect(source({ data: null, error: { message: "x" } }).store.standing("u9")).rejects.toBeInstanceOf(InfrastructureError);
  });
});
