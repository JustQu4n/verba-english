import { describe, expect, it, vi } from "vitest";

import { ForbiddenError, UnauthorizedError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakeRoles } from "@/test/fakes";

import { requireAdmin } from "./require-admin";

const signedIn = (user: typeof ADMIN_USER | null) =>
  fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(user) });

describe("requireAdmin", () => {
  it("APR-AC-01: rejects a guest without asking for roles", async () => {
    const roles = fakeRoles();
    await expect(requireAdmin({ auth: signedIn(null), roles })).rejects.toBeInstanceOf(UnauthorizedError);
    expect(roles.isAdmin).not.toHaveBeenCalled();
  });

  it("APR-AC-02: rejects a signed-in user who is not an admin", async () => {
    await expect(
      requireAdmin({ auth: signedIn(ADMIN_USER), roles: fakeRoles(false) })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("APR-AC-02: returns the user when they are an admin", async () => {
    const roles = fakeRoles(true);
    await expect(requireAdmin({ auth: signedIn(ADMIN_USER), roles })).resolves.toEqual(ADMIN_USER);
    expect(roles.isAdmin).toHaveBeenCalledWith("admin-1");
  });
});
