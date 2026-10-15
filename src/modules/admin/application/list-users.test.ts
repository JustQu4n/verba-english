import { describe, expect, it, vi } from "vitest";

import { ForbiddenError, UnauthorizedError, ValidationError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakeRoles, fakeUsers } from "@/test/fakes";

import { listUsers } from "./list-users";

function setup(options: { admin?: boolean; signedIn?: boolean; total?: number } = {}) {
  const { admin = true, signedIn = true, total = 45 } = options;
  const users = fakeUsers(undefined, { list: vi.fn().mockResolvedValue({ items: [], total }) });
  const deps = {
    auth: fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(signedIn ? ADMIN_USER : null) }),
    roles: fakeRoles(admin),
    users,
  };
  return { users, deps };
}

describe("listUsers", () => {
  it("ADM-AC-01: a guest or a non-admin is refused and nothing is read", async () => {
    const guest = setup({ signedIn: false });
    await expect(listUsers(guest.deps, {})).rejects.toBeInstanceOf(UnauthorizedError);
    const learner = setup({ admin: false });
    await expect(listUsers(learner.deps, {})).rejects.toBeInstanceOf(ForbiddenError);
    expect(guest.users.list).not.toHaveBeenCalled();
    expect(learner.users.list).not.toHaveBeenCalled();
  });

  it("ADM-AC-02: with no input it lists the newest accounts first, 20 per page", async () => {
    const { users, deps } = setup();
    const result = await listUsers(deps, undefined);
    expect(users.list).toHaveBeenCalledWith({ query: "", role: null, order: "created", offset: 0, limit: 20 });
    expect(result).toMatchObject({ total: 45, page: 1, pageSize: 20, pageCount: 3, order: "created", role: null, query: "" });
  });

  it("ADM-AC-02: the page becomes the offset, the search is trimmed, and a bad page means the first", async () => {
    const { users, deps } = setup();
    await listUsers(deps, { page: "3", query: "  lan  ", role: "admin", order: "points" });
    expect(users.list).toHaveBeenLastCalledWith({ query: "lan", role: "admin", order: "points", offset: 40, limit: 20 });
    for (const page of ["0", "-2", "abc", "1.5", undefined]) {
      await listUsers(deps, { page });
      expect(users.list).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 0 }));
    }
  });

  it("ADM-AC-02: there is always at least one page, even for an empty list", async () => {
    const { deps } = setup({ total: 0 });
    await expect(listUsers(deps, {})).resolves.toMatchObject({ total: 0, pageCount: 1 });
  });

  it("ADM-AC-03: an empty role or order means no filter and the default order", async () => {
    const { users, deps } = setup();
    await listUsers(deps, { role: "", order: " " });
    expect(users.list).toHaveBeenCalledWith(expect.objectContaining({ role: null, order: "created" }));
  });

  it("ADM-AC-03: an unknown role or order, or a very long search, is rejected before reading", async () => {
    const { users, deps } = setup();
    for (const bad of [{ role: "root" }, { order: "random" }, { query: "x".repeat(101) }]) {
      await expect(listUsers(deps, bad)).rejects.toBeInstanceOf(ValidationError);
    }
    expect(users.list).not.toHaveBeenCalled();
  });
});
