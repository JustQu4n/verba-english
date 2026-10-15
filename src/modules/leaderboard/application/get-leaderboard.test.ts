import { describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/errors";
import { fakeAuth, fakeLeaderboard } from "@/test/fakes";

import type { RankedLearner } from "../domain/leaderboard";
import { getLeaderboard } from "./get-leaderboard";

const learner = (n: number, over: Partial<RankedLearner> = {}): RankedLearner => ({
  userId: `u${n}`,
  name: `Learner ${n}`,
  avatarUrl: null,
  points: 100 - n * 10,
  rank: n,
  ...over,
});
const signedIn = (id = "u2") => fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue({ id, email: "a@b.c" }) });

describe("getLeaderboard", () => {
  it("LDB-AC-01: reads the top 10, marks my row and leaks no user id", async () => {
    const top = [learner(1), learner(2), learner(3)];
    const leaderboard = fakeLeaderboard(top);
    const result = await getLeaderboard({ auth: signedIn("u2"), leaderboard });
    expect(leaderboard.top).toHaveBeenCalledWith(10);
    expect(result.entries.map((e) => [e.rank, e.isMe])).toEqual([[1, false], [2, true], [3, false]]);
    expect(JSON.stringify(result)).not.toContain("u2");
  });

  it("LDB-AC-02: when I am in the top, my standing comes from it", async () => {
    const leaderboard = fakeLeaderboard([learner(1), learner(2)]);
    const result = await getLeaderboard({ auth: signedIn("u2"), leaderboard });
    expect(result.me).toEqual({ rank: 2, points: 80 });
    expect(leaderboard.standing).not.toHaveBeenCalled();
  });

  it("LDB-AC-03: outside the top, my standing is read separately; null without points", async () => {
    const outside = fakeLeaderboard([learner(1)], { rank: 14, points: 30 });
    await expect(getLeaderboard({ auth: signedIn("me"), leaderboard: outside })).resolves.toMatchObject({ me: { rank: 14, points: 30 } });
    expect(outside.standing).toHaveBeenCalledWith("me");
    const none = fakeLeaderboard([learner(1)], null);
    await expect(getLeaderboard({ auth: signedIn("me"), leaderboard: none })).resolves.toMatchObject({ me: null });
  });

  it("LDB-AC-04: a guest is unauthorized and nothing is read", async () => {
    const leaderboard = fakeLeaderboard();
    await expect(getLeaderboard({ auth: fakeAuth(), leaderboard })).rejects.toBeInstanceOf(UnauthorizedError);
    expect(leaderboard.top).not.toHaveBeenCalled();
  });
});
