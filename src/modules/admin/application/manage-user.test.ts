import { describe, expect, it, vi } from "vitest";

import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakeRoles, fakeUsers, sampleAccount } from "@/test/fakes";

import { getOverview, getUser, updateUser } from "./manage-user";

const ID = "22222222-2222-4222-8222-222222222222";

function setup(options: { admin?: boolean; signedIn?: boolean; account?: ReturnType<typeof sampleAccount> | null; actor?: typeof ADMIN_USER } = {}) {
  const { admin = true, signedIn = true, account = sampleAccount(), actor = ADMIN_USER } = options;
  const users = fakeUsers(account);
  const deps = {
    auth: fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(signedIn ? actor : null) }),
    roles: fakeRoles(admin),
    users,
  };
  return { users, deps };
}

describe("getUser", () => {
  it("ADM-AC-04: an admin gets the account", async () => {
    const { deps, users } = setup();
    await expect(getUser(deps, ID)).resolves.toMatchObject({ id: ID, email: "learner@verba.test" });
    expect(users.find).toHaveBeenCalledWith(ID);
  });

  it("ADM-AC-04: a malformed id or an unknown account is not found, and a malformed id never reaches the store", async () => {
    const { deps, users } = setup({ account: null });
    await expect(getUser(deps, "not-a-uuid")).rejects.toBeInstanceOf(NotFoundError);
    expect(users.find).not.toHaveBeenCalled();
    await expect(getUser(deps, ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("ADM-AC-04: a guest or a non-admin is refused", async () => {
    await expect(getUser(setup({ signedIn: false }).deps, ID)).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(getUser(setup({ admin: false }).deps, ID)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("getOverview", () => {
  it("ADM-AC-08: an admin gets the numbers; a non-admin is refused without reading them", async () => {
    const ok = setup();
    await expect(getOverview(ok.deps)).resolves.toMatchObject({ users: 5, promptsPublished: 4 });
    const learner = setup({ admin: false });
    await expect(getOverview(learner.deps)).rejects.toBeInstanceOf(ForbiddenError);
    expect(learner.users.overview).not.toHaveBeenCalled();
  });
});

describe("updateUser", () => {
  it("ADM-AC-05: saves only the fields given and returns the account", async () => {
    const { deps, users } = setup();
    const result = await updateUser(deps, ID, { credits: 50, points: 120, role: "admin" });
    expect(users.update).toHaveBeenCalledWith(ID, { credits: 50, points: 120, role: "admin" });
    expect(result).toMatchObject({ credits: 50, points: 120, role: "admin" });
    await updateUser(deps, ID, { credits: 0 });
    expect(users.update).toHaveBeenLastCalledWith(ID, { credits: 0 });
  });

  it("ADM-AC-05: a negative, fractional, huge or non-numeric number and an unknown role are rejected with a code", async () => {
    const { deps, users } = setup();
    const cases = [
      [{ credits: -1 }, "credits_invalid"],
      [{ credits: 1.5 }, "credits_invalid"],
      [{ credits: 1_000_001 }, "credits_invalid"],
      [{ credits: "12" }, "credits_invalid"],
      [{ points: -5 }, "points_invalid"],
      [{ points: 10_000_001 }, "points_invalid"],
      [{ role: "root" }, "role_invalid"],
    ] as const;
    for (const [input, code] of cases) {
      await expect(updateUser(deps, ID, input)).rejects.toMatchObject({ message: code });
    }
    expect(users.update).not.toHaveBeenCalled();
  });

  it("ADM-AC-06: an admin cannot change their own role, but can change their own credits and points", async () => {
    const { deps, users } = setup({ account: sampleAccount({ id: ID, role: "admin" }), actor: { id: ID, email: "me@verba.test" } });
    await expect(updateUser(deps, ID, { role: "user" })).rejects.toMatchObject({ message: "cannot_change_own_role" });
    expect(users.update).not.toHaveBeenCalled();
    await expect(updateUser(deps, ID, { role: "admin", credits: 5 })).resolves.toBeDefined();
    expect(users.update).toHaveBeenCalledTimes(1);
  });

  it("ADM-AC-06: another admin's role can be changed", async () => {
    const { deps } = setup({ account: sampleAccount({ role: "admin" }) });
    await expect(updateUser(deps, ID, { role: "user" })).resolves.toMatchObject({ role: "user" });
  });

  it("ADM-AC-07: an unknown account or a malformed id is not found and nothing is written", async () => {
    const { deps, users } = setup({ account: null });
    await expect(updateUser(deps, ID, { credits: 1 })).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateUser(deps, "x", { credits: 1 })).rejects.toBeInstanceOf(NotFoundError);
    expect(users.update).not.toHaveBeenCalled();
  });

  it("ADM-AC-07: an account that disappears between the read and the write is not found", async () => {
    const { deps, users } = setup();
    vi.mocked(users.update).mockResolvedValue(null);
    await expect(updateUser(deps, ID, { credits: 1 })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("ADM-AC-05: a guest or a non-admin is refused and nothing is written", async () => {
    const guest = setup({ signedIn: false });
    const learner = setup({ admin: false });
    await expect(updateUser(guest.deps, ID, { credits: 1 })).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(updateUser(learner.deps, ID, { credits: 1 })).rejects.toBeInstanceOf(ForbiddenError);
    expect(guest.users.update).not.toHaveBeenCalled();
    expect(learner.users.update).not.toHaveBeenCalled();
  });
});
