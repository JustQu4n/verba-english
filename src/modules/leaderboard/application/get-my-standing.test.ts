import { describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/errors";
import { fakeAuth, fakeLeaderboard } from "@/test/fakes";

import { getMyStanding } from "./get-my-standing";

describe("getMyStanding", () => {
  it("PRP-AC-08: reads only the signed-in learner's rank and points", async () => {
    const leaderboard = fakeLeaderboard([], { rank: 4, points: 120 });
    const auth = fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue({ id: "me", email: null }) });
    await expect(getMyStanding({ auth, leaderboard })).resolves.toEqual({ rank: 4, points: 120 });
    expect(leaderboard.standing).toHaveBeenCalledWith("me");
    expect(leaderboard.top).not.toHaveBeenCalled();
  });

  it("PRP-AC-08: no points means no rank, and a guest is unauthorized", async () => {
    const auth = fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue({ id: "me", email: null }) });
    await expect(getMyStanding({ auth, leaderboard: fakeLeaderboard([], null) })).resolves.toBeNull();
    await expect(getMyStanding({ auth: fakeAuth(), leaderboard: fakeLeaderboard() })).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
