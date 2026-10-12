import { describe, expect, it } from "vitest";

import { UnauthorizedError } from "@/core/errors";
import type { Profile } from "@/modules/profile/domain/profile";
import { fakeAuth } from "@/test/fakes";

import { getMyProfile } from "./get-my-profile";
import type { ProfileRepository } from "./profile-repository";

const user = { id: "u1", email: "a@b.com" };
const profile: Profile = {
  id: "u1",
  fullName: "Alex Lee",
  avatarUrl: null,
  createdAt: new Date("2026-01-01"),
};

const reposWith = (found: Profile | null): ProfileRepository => ({ findById: async () => found });

describe("getMyProfile", () => {
  it("PRF-AC-01: not signed in → UnauthorizedError", async () => {
    await expect(
      getMyProfile({ auth: fakeAuth(), profiles: reposWith(profile) })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("PRF-AC-02: returns the user with their profile", async () => {
    const auth = fakeAuth({ getCurrentUser: async () => user });
    await expect(getMyProfile({ auth, profiles: reposWith(profile) })).resolves.toEqual({
      user,
      profile,
    });
  });

  it("PRF-AC-03: no profile yet → profile = null", async () => {
    const auth = fakeAuth({ getCurrentUser: async () => user });
    const result = await getMyProfile({ auth, profiles: reposWith(null) });
    expect(result).toEqual({ user, profile: null });
  });

  it("PRF-AC-02: only looks up the profile by the user's own id", async () => {
    const seen: string[] = [];
    const profiles: ProfileRepository = {
      findById: async (id) => (seen.push(id), profile),
    };
    await getMyProfile({ auth: fakeAuth({ getCurrentUser: async () => user }), profiles });
    expect(seen).toEqual(["u1"]);
  });
});
