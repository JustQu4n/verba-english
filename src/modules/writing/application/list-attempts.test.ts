import { describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/errors";
import { ADMIN_USER, fakeAttempts, fakeAuth } from "@/test/fakes";

import { ATTEMPTS_PAGE_SIZE, listAttempts } from "./list-attempts";

function deps(total = 45, signedIn = true) {
  const attempts = fakeAttempts({ list: vi.fn().mockResolvedValue({ items: [], total }) });
  const auth = fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(signedIn ? ADMIN_USER : null) });
  return { auth, attempts };
}

describe("listAttempts", () => {
  it("ATT-AC-04: reads the signed-in learner's attempts one page at a time", async () => {
    const d = deps();
    const result = await listAttempts(d, { page: "2" });
    expect(d.attempts.list).toHaveBeenCalledWith(ADMIN_USER.id, { offset: ATTEMPTS_PAGE_SIZE, limit: ATTEMPTS_PAGE_SIZE });
    expect(result).toMatchObject({ page: 2, pageSize: 20, total: 45, pageCount: 3 });
  });

  it.each([undefined, "0", "-3", "abc", "1.5", ""])("ATT-AC-04: page %j falls back to the first page", async (page) => {
    const d = deps();
    await expect(listAttempts(d, { page })).resolves.toMatchObject({ page: 1 });
    expect(d.attempts.list).toHaveBeenCalledWith(ADMIN_USER.id, { offset: 0, limit: ATTEMPTS_PAGE_SIZE });
  });

  it("ATT-AC-04: no attempts is one empty page", async () => {
    await expect(listAttempts(deps(0), {})).resolves.toMatchObject({ total: 0, pageCount: 1 });
  });

  it("ATT-AC-04: a guest is unauthorized and nothing is read", async () => {
    const d = deps(1, false);
    await expect(listAttempts(d, {})).rejects.toBeInstanceOf(UnauthorizedError);
    expect(d.attempts.list).not.toHaveBeenCalled();
  });
});
