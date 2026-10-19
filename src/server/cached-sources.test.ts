import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LeaderboardSource } from "@/modules/leaderboard/application/leaderboard-source";
import type { SentencePromptSource } from "@/modules/writing/application/sentence-prompt-source";

const top = vi.hoisted(() => vi.fn());
const counts = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("next/navigation", () => ({
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
  },
}));
vi.mock("@/infrastructure/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/modules/leaderboard/infrastructure/supabase-leaderboard-source", () => ({
  SupabaseLeaderboardSource: class {
    top = top;
  },
}));
vi.mock("@/modules/writing/infrastructure/supabase-sentence-prompt-source", () => ({
  SupabaseSentencePromptSource: class {
    countByCategory = counts;
  },
}));

import { CachedLeaderboardSource, CachedPromptSource } from "./cached-sources";

beforeEach(() => {
  top.mockReset();
  counts.mockReset();
});

describe("CachedLeaderboardSource", () => {
  it("CHE-AC-01: the top comes from the shared read, one learner's standing is read live", async () => {
    const ranked = [{ userId: "u1", name: "A", avatarUrl: null, points: 10, rank: 1 }];
    top.mockResolvedValue(ranked);
    const inner: LeaderboardSource = { top: vi.fn(), standing: vi.fn().mockResolvedValue({ rank: 14, points: 3 }) };
    const source = new CachedLeaderboardSource(inner);
    await expect(source.top(10)).resolves.toBe(ranked);
    expect(top).toHaveBeenCalledWith(10);
    expect(inner.top).not.toHaveBeenCalled();
    await expect(source.standing("u9")).resolves.toEqual({ rank: 14, points: 3 });
    expect(inner.standing).toHaveBeenCalledWith("u9");
  });
});

describe("CachedPromptSource", () => {
  const inner = (): SentencePromptSource => ({
    list: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
    countByCategory: vi.fn().mockResolvedValue({ "everyday-life": 1 }),
  });

  it("CHE-AC-02: category totals come from the shared read; sentences are read live", async () => {
    counts.mockResolvedValue({ "everyday-life": 7 });
    const live = inner();
    const source = new CachedPromptSource(live);
    await expect(source.countByCategory("beginner")).resolves.toEqual({ "everyday-life": 7 });
    expect(live.countByCategory).not.toHaveBeenCalled();
    await source.list({ level: "beginner", category: "everyday-life" });
    await source.get("id");
    expect(live.list).toHaveBeenCalledWith({ level: "beginner", category: "everyday-life" });
    expect(live.get).toHaveBeenCalledWith("id");
  });

  it("CHE-AC-03: when the shared read fails the totals are read directly", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    counts.mockRejectedValue(new Error("Missing SUPABASE_SERVICE_ROLE_KEY"));
    const live = inner();
    await expect(new CachedPromptSource(live).countByCategory("beginner")).resolves.toEqual({ "everyday-life": 1 });
    expect(live.countByCategory).toHaveBeenCalledWith("beginner");
  });

  it("CHE-AC-03: a Next control-flow error is not swallowed", async () => {
    counts.mockRejectedValue(new Error("NEXT_REDIRECT"));
    const live = inner();
    await expect(new CachedPromptSource(live).countByCategory("beginner")).rejects.toThrow("NEXT_REDIRECT");
    expect(live.countByCategory).not.toHaveBeenCalled();
  });
});
